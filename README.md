# URLio 🔗

> A beautiful, cross-platform URL shortener & expander desktop app built with Electron, Three.js, and GSAP.

![URLio Screenshot](assets/screenshot.png)

## ✨ Features

- 🔗 **Shorten** any URL for free using the is.gd API (no account needed)
- 🔍 **Expand** any short URL to reveal its true destination
- 📋 **Copy to clipboard** with one click
- 📱 **QR Code generator** — download as PNG
- 🕐 **History** — all your shortened/expanded URLs saved locally
- 🎨 **Dark mode** with 3D animated background (Three.js + GSAP)
- 🖥️ **Cross-platform** — Windows, Mac, Linux

---

## 🚀 Install & Run (for everyone)

### Option 1 — Download the app (easiest)
Go to [Releases](https://github.com/YOUR_USERNAME/urlio/releases) and download:
- **Windows** → `URLio-Setup-x.x.x.exe` or `URLio-x.x.x-portable.exe`
- **Mac** → `URLio-x.x.x-arm64.dmg` (Apple Silicon) or `URLio-x.x.x.dmg` (Intel)
- **Linux** → `URLio-x.x.x.AppImage` or `URLio-x.x.x.deb`

### Option 2 — Homebrew (Mac)
```bash
brew tap YOUR_USERNAME/urlio
brew install --cask urlio
```

### Option 3 — Clone & run from source
```bash
# Requirements: Node.js 18+ (https://nodejs.org)

git clone https://github.com/YOUR_USERNAME/urlio.git
cd urlio
npm install
npm start
```

---

## 🔨 Build from source

```bash
# Build for all platforms (requires Mac for .dmg)
npm run build

# Build for specific platform
npm run build:mac    # .dmg + .zip
npm run build:win    # .exe installer + portable
npm run build:linux  # .AppImage + .deb
```

Output files will be in the `dist/` folder.

---

## 📦 Publish a new release (GitHub Actions)

Releases are automated. Just push a version tag:

```bash
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions will automatically:
1. Build the app for Windows, Mac, and Linux
2. Create a GitHub Release with all the installers attached

---

## 🍺 Homebrew setup (for maintainers)

After publishing a release:
1. Get the SHA256 of your `.dmg`:
   ```bash
   shasum -a 256 URLio-1.0.0-arm64.dmg
   ```
2. Update `Formula/urlio.rb` with the new `sha256` and `url`
3. Create a separate repo named `homebrew-urlio`
4. Put `Formula/urlio.rb` there
5. Users can then install with:
   ```bash
   brew tap YOUR_USERNAME/urlio
   brew install --cask urlio
   ```

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Shell | [Electron](https://electronjs.org) v28 |
| 3D Background | [Three.js](https://threejs.org) r128 |
| Animations | [GSAP](https://greensock.com/gsap/) 3.12 |
| URL Shortening | [is.gd](https://is.gd) API (free, no auth) |
| QR Codes | [QRCode.js](https://davidshimjs.github.io/qrcodejs/) |
| Fonts | Inter + Space Grotesk (Google Fonts) |

---

## 📁 Project Structure

```
urlio/
├── main.js          # Electron main process (IPC, API calls)
├── preload.js       # Context bridge (safe API exposure)
├── index.html       # App UI structure
├── renderer.js      # Frontend logic (Three.js, GSAP, events)
├── style.css        # All styles
├── package.json     # Dependencies + electron-builder config
├── Formula/
│   └── urlio.rb     # Homebrew formula template
├── .github/
│   └── workflows/
│       └── build.yml  # Auto-build & release CI/CD
└── assets/
    └── icon.png     # App icon (replace with your own)
```

---

## 📄 License

MIT © Your Name
