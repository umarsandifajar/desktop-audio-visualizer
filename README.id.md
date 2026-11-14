# Desktop Audio Visualizer

**Overlay visualizer audio real-time untuk desktop Windows.** Bereaksi ke *semua* suara yang diputar di PC (Spotify, YouTube, game, dll) lewat WASAPI loopback, jadi tidak perlu Stereo Mix atau kabel audio virtual.

[![Release](https://img.shields.io/github/v/release/umarsandifajar/desktop-audio-visualizer?style=flat-square)](../../releases/latest)
[![Downloads](https://img.shields.io/github/downloads/umarsandifajar/desktop-audio-visualizer/total?style=flat-square)](../../releases)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6?style=flat-square)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

🇬🇧 [Read in English](README.md)

## Unduh

Unduh versi terbaru di halaman **[Releases](../../releases/latest)**:

| File | Keterangan |
|---|---|
| `DesktopAudioVisualizer-Setup-<versi>.exe` | Installer (bisa pilih folder instalasi, shortcut desktop) |
| `DesktopAudioVisualizer-Portable-<versi>.exe` | Portable, tanpa instalasi, tinggal jalankan |

> **Muncul peringatan Windows SmartScreen?** File `.exe` belum ditandatangani (code signing). Klik **More info → Run anyway**.

## Fitur

- **17 model bawaan:** Bars, Mirror bars, Radial, Waveform, Oscilloscope, Particles, Orb, Spectrogram, Warp tunnel, Starfield, Ripple rings, Pulsar ridges, LED matrix, Aurora, Kaleidoscope, DNA helix, dan Fireworks (yang terakhir bereaksi pada hentakan bass).
- **MilkDrop:** ratusan preset siap pakai lewat [Butterchurn](https://github.com/jberg/butterchurn), ganti otomatis atau manual.
- **Preset gaya (JSON):** simpan, impor, dan bagikan. 24 contoh sudah disertakan.
- **Bisa diatur sepenuhnya:** ukuran, opacity, warna / gradient / pelangi berjalan, jumlah bar, sensitivitas, kehalusan, batas FPS.
- **Efek:** glow, blur, denyut bass, trails, rotasi, putaran otomatis, flip.
- **Overlay selalu di atas dan klik tembus.** Pindah dan ubah ukuran lewat mode edit.
- **Fade tepi lembut** di keempat sisi, plus toggle *Full width* sekali klik.
- **Mode wallpaper** (eksperimental): tampil di belakang icon desktop.
- **Tray icon, hotkey global, auto-start, auto-hide saat hening.**
- **Dua bahasa:** English (default) dan Indonesia.

## Hotkey

| Tombol | Fungsi |
|---|---|
| `Ctrl+Alt+V` | Tampil / sembunyi |
| `Ctrl+Alt+E` | Mode edit (seret = pindah, scroll = ukuran). Keluar: tombol Done, `Esc`, klik dua kali, menu tray, atau otomatis setelah 2 menit |
| `Ctrl+Alt+S` | Buka settings |
| `Ctrl+Alt+N` | Model berikutnya |
| `Ctrl+Alt+P` | Preset MilkDrop berikutnya |

## Build dari source

Butuh Windows dan Node.js 20+.

```bash
git clone https://github.com/umarsandifajar/desktop-audio-visualizer.git
cd desktop-audio-visualizer
npm install
npm start               # jalankan langsung
npm run dist            # installer + portable -> folder dist/
npm run dist:installer  # installer saja
npm run dist:portable   # portable saja
```

Tanpa install apa pun di PC: jalankan workflow **Build Windows** di tab *Actions*, lalu unduh artifact `windows-builds`.

## Lokasi data

`%APPDATA%\Desktop Audio Visualizer\`

- `settings.json`: pengaturan
- `presets\`: preset gaya (`{ "name": "...", "settings": { ... } }`)
- `milkdrop\`: preset MilkDrop tambahan (Butterchurn JSON)

Versi portable memakai lokasi yang sama, jadi pengaturan tidak ikut terbawa saat folder dipindah.

## Catatan

- Jendela transparan di Windows tidak bisa di-resize lewat tepi. Atur ukuran lewat slider atau scroll mouse di mode edit.
- Mode wallpaper memakai trik WorkerW lewat [`koffi`](https://koffi.dev), dengan fallback Progman untuk Windows 11 24H2. Kalau gagal, aplikasi kembali ke overlay biasa.
- Preset MilkDrop tampil dengan latar penuh (tidak transparan).

## Dibuat dengan

[Electron](https://www.electronjs.org/) · [Butterchurn](https://github.com/jberg/butterchurn) · [koffi](https://koffi.dev)

## Lisensi

[MIT](LICENSE) © 2026 Fajar Umarsandi

Kalau project ini berguna, kamu bisa [traktir kopi ☕](https://umarsandifajar.github.io/bio-sandiana/).
