const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  clipboard,
  ipcMain,
  nativeImage,
  nativeTheme,
  screen,
} = require('electron');
const path = require('path');

const MAX_ITEMS = 100;
const POLL_MS = 500;

let tray = null;
let win = null;
let items = []; // newest first
let lastSig = '';
let suppressNextPoll = false;

// ---------- clipboard ----------

function readClipboardEntry() {
  // Files (macOS: 'public.file-url' returns one URL string per read; multi-file is tricky in Electron)
  const fileUrl = (() => {
    try {
      return clipboard.read('public.file-url');
    } catch {
      return '';
    }
  })();
  if (fileUrl && fileUrl.startsWith('file://')) {
    const p = decodeURIComponent(fileUrl.replace(/^file:\/\//, ''));
    return { type: 'files', files: [p] };
  }

  const img = clipboard.readImage();
  if (img && !img.isEmpty()) {
    const size = img.getSize();
    return {
      type: 'image',
      dataURL: img.toDataURL(),
      width: size.width,
      height: size.height,
    };
  }

  const rtf = clipboard.readRTF();
  const text = clipboard.readText();
  if (rtf && rtf.length > 0) {
    return { type: 'richText', rtf, plain: text || '' };
  }
  if (text && text.length > 0) {
    return { type: 'text', text };
  }
  return null;
}

function signatureOf(entry) {
  if (!entry) return '';
  switch (entry.type) {
    case 'text':
      return 't:' + entry.text;
    case 'richText':
      return 'r:' + (entry.rtf || '').slice(0, 4000);
    case 'image':
      return 'i:' + entry.dataURL.length + ':' + entry.dataURL.slice(-80);
    case 'files':
      return 'f:' + entry.files.join('|');
    default:
      return '';
  }
}

function previewOf(entry) {
  switch (entry.type) {
    case 'text':
      return entry.text;
    case 'richText':
      return entry.plain || '(rich text)';
    case 'image':
      return `Image ${entry.width}×${entry.height}`;
    case 'files':
      return entry.files.map((p) => p.split('/').pop()).join(', ');
  }
  return '';
}

function pollClipboard() {
  if (suppressNextPoll) {
    suppressNextPoll = false;
    lastSig = signatureOf(readClipboardEntry());
    return;
  }
  const entry = readClipboardEntry();
  const sig = signatureOf(entry);
  if (!entry || !sig || sig === lastSig) return;
  lastSig = sig;

  const item = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    preview: previewOf(entry),
    ...entry,
  };
  items.unshift(item);
  if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
  broadcastItems();
}

function writeEntryToClipboard(item) {
  suppressNextPoll = true;
  switch (item.type) {
    case 'text':
      clipboard.writeText(item.text);
      break;
    case 'richText':
      clipboard.write({ text: item.plain, rtf: item.rtf });
      break;
    case 'image':
      clipboard.writeImage(nativeImage.createFromDataURL(item.dataURL));
      break;
    case 'files':
      clipboard.writeText(item.files.join('\n'));
      break;
  }
}

// ---------- window ----------

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 540,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    vibrancy: 'hud',
    visualEffectState: 'active',
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  win.setWindowButtonVisibility?.(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.on('blur', () => {
    if (win && win.isVisible()) win.hide();
  });
}

function showWindowNearMouse() {
  if (!win) createWindow();
  const mouse = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(mouse);
  const wa = display.workArea;
  const { width, height } = win.getBounds();
  let x = mouse.x + 12;
  let y = mouse.y + 12;
  x = Math.max(wa.x + 8, Math.min(x, wa.x + wa.width - width - 8));
  y = Math.max(wa.y + 8, Math.min(y, wa.y + wa.height - height - 8));
  win.setPosition(Math.round(x), Math.round(y));
  broadcastItems();
  win.show();
  win.focus();
}

function toggleWindow() {
  if (win && win.isVisible()) {
    win.hide();
  } else {
    showWindowNearMouse();
  }
}

function broadcastItems() {
  if (win && !win.isDestroyed() && win.webContents) {
    win.webContents.send('items:update', items.map(stripForRenderer));
  }
}

// Strip heavy fields renderer doesn't need to keep around.
function stripForRenderer(it) {
  if (it.type === 'image') {
    return {
      id: it.id,
      ts: it.ts,
      type: 'image',
      preview: it.preview,
      width: it.width,
      height: it.height,
      thumbnail: it.dataURL, // base64 PNG — fine for preview
    };
  }
  return {
    id: it.id,
    ts: it.ts,
    type: it.type,
    preview: it.preview,
    files: it.files,
  };
}

// ---------- tray ----------

function createTray() {
  tray = new Tray(nativeImage.createEmpty());
  tray.setTitle('⌘V');
  tray.setToolTip('Clipboard History (⌘⇧V)');
  const menu = Menu.buildFromTemplate([
    { label: 'Show History  ⌘⇧V', click: showWindowNearMouse },
    { type: 'separator' },
    {
      label: 'Clear History',
      click: () => {
        items = [];
        lastSig = '';
        broadcastItems();
      },
    },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', toggleWindow);
}

// ---------- ipc ----------

ipcMain.handle('items:get', () => items.map(stripForRenderer));
ipcMain.on('item:select', (_, id) => {
  const found = items.find((it) => it.id === id);
  if (found) writeEntryToClipboard(found);
  if (win && win.isVisible()) win.hide();
});
ipcMain.on('window:close', () => {
  if (win && win.isVisible()) win.hide();
});
ipcMain.on('items:clear', () => {
  items = [];
  lastSig = '';
  broadcastItems();
});
ipcMain.on('app:quit', () => {
  app.quit();
});

// ---------- app lifecycle ----------

// Single-instance lock: when the user double-clicks the .app while it's already
// running, second-instance fires and we surface the panel near the cursor.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showWindowNearMouse();
  });
}

app.whenReady().then(() => {
  // Force dark appearance so vibrancy renders dark regardless of system theme.
  nativeTheme.themeSource = 'dark';

  if (process.platform === 'darwin') app.dock?.hide();
  createWindow();
  createTray();

  lastSig = signatureOf(readClipboardEntry());
  setInterval(pollClipboard, POLL_MS);

  const ok = globalShortcut.register('CommandOrControl+Shift+V', toggleWindow);
  if (!ok) console.error('Failed to register global shortcut ⌘⇧V');

  // Show the panel on first launch so the user gets immediate visual feedback.
  showWindowNearMouse();
});

app.on('window-all-closed', (e) => {
  e.preventDefault?.();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
