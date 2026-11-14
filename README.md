# Desktop Audio Visualizer

**A real-time audio visualizer overlay for your Windows desktop.** It reacts to *everything* your PC plays (Spotify, YouTube, games, you name it) using WASAPI loopback, so there's no need for Stereo Mix or a virtual audio cable.

[![Release](https://img.shields.io/github/v/release/umarsandifajar/desktop-audio-visualizer?style=flat-square)](../../releases/latest)
[![Downloads](https://img.shields.io/github/downloads/umarsandifajar/desktop-audio-visualizer/total?style=flat-square)](../../releases)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6?style=flat-square)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

🇮🇩 [Baca dalam Bahasa Indonesia](README.id.md)

<!-- Add a screenshot or GIF here, e.g.: ![Preview](docs/preview.gif) -->

## Download

Grab the latest build from the **[Releases page](../../releases/latest)**:

| File | Description |
|---|---|
| `DesktopAudioVisualizer-Setup-<version>.exe` | Installer (choose install folder, desktop shortcut) |
| `DesktopAudioVisualizer-Portable-<version>.exe` | Portable, no installation needed, just run it |

> **Windows SmartScreen warning?** The `.exe` files are not code-signed yet. Click **More info → Run anyway**.

## Features

- **17 built-in visualizers:** Bars, Mirror bars, Radial, Waveform, Oscilloscope, Particles, Orb, Spectrogram, Warp tunnel, Starfield, Ripple rings, Pulsar ridges, LED matrix, Aurora, Kaleidoscope, DNA helix and Fireworks (the last one reacts to bass hits).
- **MilkDrop:** hundreds of ready-made presets via [Butterchurn](https://github.com/jberg/butterchurn), with auto or manual switching.
- **Style presets (JSON):** save, import and share your own looks. 24 examples included.
- **Full customization:** size, opacity, color / gradient / moving rainbow, bar count, sensitivity, smoothing, FPS limit.
- **Effects:** glow, blur, bass pulse, trails, rotation, auto spin, flip.
- **Always-on-top, click-through overlay.** Move and resize it in edit mode without it getting in your way.
- **Soft edge fade** on all four sides, plus a one-click *Full width* toggle.
- **Wallpaper mode** (experimental): render behind your desktop icons.
- **Tray icon, global hotkeys, start with Windows, auto-hide when silent.**
- **Two languages:** English (default) and Indonesian.

## Hotkeys

| Shortcut | Action |
|---|---|
| `Ctrl+Alt+V` | Show / hide |
| `Ctrl+Alt+E` | Edit mode (drag = move, scroll = resize). Exit with the Done button, `Esc`, double-click, the tray menu, or automatically after 2 minutes |
| `Ctrl+Alt+S` | Open settings |
| `Ctrl+Alt+N` | Next visualizer |
| `Ctrl+Alt+P` | Next MilkDrop preset |

## Build from source

Requires Windows and Node.js 20+.

```bash
git clone https://github.com/umarsandifajar/desktop-audio-visualizer.git
cd desktop-audio-visualizer
npm install
npm start               # run in development
npm run dist            # installer + portable -> dist/
npm run dist:installer  # installer only
npm run dist:portable   # portable only
```

No local setup? Run the **Build Windows** workflow in the *Actions* tab and download the `windows-builds` artifact.

## Data location

`%APPDATA%\Desktop Audio Visualizer\`

- `settings.json`: your settings
- `presets\`: style presets (`{ "name": "...", "settings": { ... } }`)
- `milkdrop\`: extra MilkDrop presets (Butterchurn JSON)

The portable version uses the same location, so settings don't travel with the folder.

## Notes

- Transparent windows on Windows can't be resized by their edges. Use the size sliders or scroll in edit mode instead.
- Wallpaper mode uses the WorkerW trick through [`koffi`](https://koffi.dev), with a Progman fallback for Windows 11 24H2. If it fails, the app falls back to the normal overlay.
- MilkDrop presets are drawn with a solid (non-transparent) background.

## Built with

[Electron](https://www.electronjs.org/) · [Butterchurn](https://github.com/jberg/butterchurn) · [koffi](https://koffi.dev)

## License

[MIT](LICENSE) © 2026 Fajar Umarsandi

If you like this project, you can [buy me a coffee ☕](https://umarsandifajar.github.io/bio-sandiana/).
