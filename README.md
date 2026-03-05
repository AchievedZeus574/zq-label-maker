# ZQ Label Maker

An unofficial Android app for creating and printing labels on Zebra ZQ620 Bluetooth printers. Designed as an internal productivity tool to replace handwritten labels with consistent, template-based printed labels.

> **Disclaimer:** This app is not affiliated with, endorsed by, or officially supported by Zebra Technologies Corporation. ZPL and ZPL II are registered trademarks of Zebra Technologies Corporation.

---

## Features

- Create multi-line text labels with configurable font size, alignment, and bold
- Supports multiple label sizes: Shelf Label (2×1.25"), VizPick Label (3×2"), Fact Tag (4×3"), and 1×1 Label (1.25×1")
- Portrait and landscape orientation with top, center, and bottom vertical alignment
- Live label preview before printing
- Multi-label print jobs — queue multiple labels with individual copy counts in a single job
- Bluetooth pairing and connection via barcode scan or manual MAC entry
- Auto-pairs printer if not already paired at OS level
- Connects on demand and disconnects after printing to preserve battery
- Remembers your printer across app restarts
- Dark mode support following system theme

---

## Supported Hardware

- **Printer:** Zebra ZQ620 (203 DPI)
- **Media:** Non-continuous black mark labels
- **Connection:** Bluetooth Classic (SPP)

Other Zebra printers using ZPL over Bluetooth Classic may work but are untested.

---

## Installation

Download the latest APK from the [Releases](../../releases) page and install it on your Android device. You may need to enable **Install from unknown sources** in your device settings.

Minimum Android version: **Android 8.0 (API 26)**

---

## Building from Source

### Prerequisites

- Node.js 18+ (via nvm recommended)
- Android Studio with Android SDK
- Java 17 (Android Studio JBR works)
- A connected Android device or emulator with USB debugging enabled

### Setup

```bash
git clone <repo-url>
cd ZQLabelMaker
npm install
```

### Debug Build

```bash
npx react-native run-android
```

### Release Build

1. Create a keystore if you don't have one:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias zqlabelmaker -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/keystore.properties`:
```
storePassword=yourpassword
keyPassword=yourpassword
keyAlias=zqlabelmaker
storeFile=/path/to/release.keystore
```

3. Build the APK:
```bash
cd android && ./gradlew assembleRelease
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`.

---

## ZPL Notes

Labels are generated using ZPL II and sent directly to the printer over Bluetooth. The generated ZPL assumes:

- 203 DPI print density
- Non-continuous media with black mark sensing (`^MNA`)
- Printer loaded in inverted orientation (`^POI`)
- Single label or copy count per job (`^PQ`)

You can preview generated ZPL at [Labelary Online ZPL Viewer](http://labelary.com/viewer.html).

---

## Project Structure

```
src/
  components/     # Reusable UI components (BarcodeScanner)
  context/        # App-wide state (PrinterContext, ThemeContext)
  screens/        # Full screens (EditorScreen, PrinterScreen)
  types/          # TypeScript declarations
  utils/          # Pure logic (zplGenerator, theme)
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.