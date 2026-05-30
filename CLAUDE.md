# ClipDeck

Menu-bar clipboard history app for macOS. Electron + vanilla HTML/CSS/JS.
Open source on GitHub (zc9632/clip-deck), MIT licensed, ships unsigned dmg/zip.

## Run / build / release

```bash
npm start                          # dev mode
npm run dist                       # local package (arm64 + x64 dmg/zip in dist/)
npm version patch && git push --follow-tags   # cut a release; CI publishes
```

CI lives in `.github/workflows/release.yml`. It triggers on `v*` tags, runs
electron-builder, uploads `.dmg`/`.zip` to GitHub Releases. No code signing
(`CSC_IDENTITY_AUTO_DISCOVERY=false`), users bypass Gatekeeper per README.

`gh` CLI lives at `~/bin/gh` (PATH isn't updated; call it explicitly).

## Code layout

```
main.js          main process: tray, global hotkey ⌘⇧V, clipboard polling,
                 BrowserWindow (NSPanel-like floating), IPC handlers,
                 single-instance lock
preload.js       contextBridge → window.cb { getItems, onItems, select,
                 close, clear, quit }
renderer/
  index.html     panel layout
  style.css      dark frosted-glass with cyan accents
  app.js         keyboard + search + render + IPC calls
docs/screenshot.png   README hero image
.github/workflows/release.yml
```

Single window, no router, no framework. Keep it that way.

## Design conventions (don't redo these debates)

- **In-memory only.** No SQLite, no JSON dump, no `~/Library/Application Support`
  write. Clearing on quit is a feature, not a bug. 100-item cap, oldest evicted.
- **Vibrancy: `'hud'` + `nativeTheme.themeSource = 'dark'`.** Tried
  `'under-window'` — too black. Don't switch. CSS bg stays
  `rgba(8, 12, 20, 0.35)` so the hud shows through.
- **Menu-bar app only** (`LSUIElement: true`, `app.dock.hide()`, Tray title
  shows `⌘V`). No Dock icon, no main window besides the panel.
- **Panel pops near the cursor** on global hotkey and on second-instance
  (so double-clicking the .app while it's running re-shows it).
- **Force dark via `nativeTheme.themeSource`** — don't follow system theme.
  Users found Light-Mode vibrancy washed-out.
- **macOS only for now.** vibrancy / Tray title / `'public.file-url'` are
  all Mac-specific. Windows/Linux ports go in a separate fork or branch,
  not main.

## Things to avoid

- Persisting clipboard data to disk (violates the privacy promise in README).
- Adding code signing without the user opting into the $99/yr Apple Developer
  Program (they explicitly chose unsigned).
- Bundling more than ~100 MB into the .app (it's already 91 MB; Electron
  baseline. Don't add heavy deps like React/Vue.)
- Auto-updates (`electron-updater`) — needs signing first.

## Where to look for current state

- Recent work: `git log --oneline -20`
- Open issues / TODOs: `~/bin/gh issue list --repo zc9632/clip-deck`
- Latest release: `~/bin/gh release view --repo zc9632/clip-deck`

Don't track progress or TODOs in this file. It rots. Use git + issues.
