# ClipDeck

Lightning-fast clipboard history for macOS. Press <kbd>⌘</kbd><kbd>⇧</kbd><kbd>V</kbd> anywhere to recall the last 100 things you copied.

> [中文说明 →](README.zh-CN.md)

![ClipDeck panel showing recent clipboard entries](docs/screenshot.png)

## Features

- 📋 Captures text, rich text, images, and file paths automatically
- ⌨️ Global hotkey <kbd>⌘</kbd><kbd>⇧</kbd><kbd>V</kbd> opens the panel next to your cursor
- 🔍 Live search across all entries
- 🎯 <kbd>⌘</kbd>+<kbd>1</kbd>–<kbd>9</kbd> to instantly paste one of the top 9 entries
- 🖥️ Menu-bar app, no Dock icon, ~150 MB RAM
- 🕶️ Dark frosted-glass UI with subtle cyan accents
- 💾 In-memory only — nothing written to disk, nothing leaves your machine

## Install

### From a Release (recommended)

1. Go to [Releases](https://github.com/zc9632/clip-deck/releases) and download the latest `ClipDeck-<version>-arm64.dmg` (Apple Silicon) or `ClipDeck-<version>.dmg` (Intel).
2. Open the `.dmg` and drag **ClipDeck** to `/Applications`.
3. **First launch — bypass Gatekeeper.** Because ClipDeck is not yet signed with a paid Apple Developer ID, macOS will block the first open. You only need to do this once:

   **Option A (GUI):** In Finder, right-click `ClipDeck.app` → **Open** → in the dialog, click **Open** again.

   **Option B (Terminal, one-liner):**
   ```bash
   xattr -dr com.apple.quarantine /Applications/ClipDeck.app
   ```
   Then double-click as usual.

4. Look for the **⌘V** badge in your menu bar — that's the app running. Press <kbd>⌘</kbd><kbd>⇧</kbd><kbd>V</kbd> from anywhere to summon the panel.

> ℹ️ Why the warning? Apple charges $99/yr for the certificate that suppresses this dialog. As an early-stage open-source project, ClipDeck ships unsigned. The source is in this repo — feel free to inspect or build it yourself.

## Usage

| Action | Key |
|---|---|
| Open / close panel | <kbd>⌘</kbd><kbd>⇧</kbd><kbd>V</kbd> |
| Move selection | <kbd>↑</kbd> <kbd>↓</kbd> |
| Paste selected entry | <kbd>⏎</kbd> |
| Quick-paste top 9 | <kbd>⌘</kbd>+<kbd>1</kbd>…<kbd>9</kbd> |
| Close without pasting | <kbd>Esc</kbd> |
| Search | Just start typing |

After you press <kbd>⏎</kbd>, the chosen entry is written to your system clipboard and the panel closes. Press <kbd>⌘</kbd><kbd>V</kbd> as usual to paste into the target app.

## Build from source

```bash
git clone https://github.com/zc9632/clip-deck.git
cd clip-deck
npm install
npm start          # run in dev mode
npm run dist       # build .dmg and .zip for both arm64 and x64
```

Distributables land in `dist/`.

## Roadmap

- [ ] Optional persistence (SQLite, opt-in)
- [ ] Per-app filters
- [ ] Pinned entries that don't get evicted
- [ ] Code signing + auto-update
- [ ] Windows & Linux ports (needs co-maintainers — see [#WANTED](https://github.com/zc9632/clip-deck/issues))

## Privacy

ClipDeck reads your system clipboard while it's running. **Nothing is written to disk; nothing is sent over the network.** History is kept only in RAM and cleared when you quit the app.

## License

MIT © Zhaochang. See [LICENSE](LICENSE).
