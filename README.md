# ImageProcessor — React Native Turbo Module Gallery

A React Native application that implements a **native image processing module** using **Turbo Modules (New Architecture)** for both iOS (Swift) and Android (Kotlin). The app processes bundled images into thumbnails and displays them in an optimised FlatList gallery with multi-select, preview, and batch processing capabilities.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Running on Android](#running-on-android)
- [Running on iOS](#running-on-ios)
- [Project Structure](#project-structure)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Technology       | Version     |
| ---------------- | ----------- |
| React Native     | 0.86.2      |
| React            | 19.2.3      |
| TypeScript       | 5.8+        |
| Kotlin           | 2.1.20      |
| Swift            | 5+          |
| New Architecture | Enabled     |
| JS Engine        | Hermes      |
| Package Manager  | Yarn 4.x    |

---

## Prerequisites

Before cloning the project, make sure your development machine has the following tools installed. Follow the official [React Native — Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide if you haven't already.

### All Platforms

| Tool          | Required Version | How to verify              | Install / Docs |
| ------------- | ---------------- | -------------------------- | -------------- |
| **Node.js**   | >= 22.11.0       | `node --version`           | [nodejs.org](https://nodejs.org/) or use `nvm` |
| **Yarn**      | 4.x (Berry)      | `yarn --version`           | [Yarn Installation](https://yarnpkg.com/getting-started/install) |
| **Watchman**  | Latest           | `watchman --version`       | `brew install watchman` |
| **Git**       | Latest           | `git --version`            | [git-scm.com](https://git-scm.com/) |

> **Note on Yarn**: This project uses Yarn 4 (Berry) with `nodeLinker: node-modules`. Do **not** use Yarn Classic (v1) or npm — the lockfile (`yarn.lock`) is Yarn 4-specific.

### Android-Specific

| Tool                  | Required Version       | How to verify                          | Notes |
| --------------------- | ---------------------- | -------------------------------------- | ----- |
| **JDK**               | 17                     | `java -version`                        | Install via `brew install --cask zulu@17` (macOS) |
| **Android Studio**    | Latest stable          | Open Android Studio → About            | [developer.android.com](https://developer.android.com/studio) |
| **Android SDK**       | API 36 (compileSdk)    | SDK Manager in Android Studio          | Also install Build Tools 36.0.0 |
| **NDK**               | 27.1.12297006          | SDK Manager → SDK Tools → NDK          | Must match exact version |
| **Android Emulator**  | API 24+ device         | AVD Manager in Android Studio          | Recommend API 34+ for best results |

Make sure the following environment variables are set (add to `~/.zshrc` or `~/.bash_profile`):

```sh
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

After editing, run `source ~/.zshrc` (or restart your terminal).

### iOS-Specific (macOS Only)

| Tool          | Required Version | How to verify             | Notes |
| ------------- | ---------------- | ------------------------- | ----- |
| **macOS**     | 13+ (Ventura)    | Apple menu → About This Mac | Required for latest Xcode |
| **Xcode**     | 15+              | `xcodebuild -version`    | Install from the Mac App Store |
| **Xcode CLI** | Latest           | `xcode-select -p`        | `xcode-select --install` if missing |
| **CocoaPods** | >= 1.13          | `pod --version`           | Installed via Bundler (see below) |
| **Ruby**      | >= 2.6.10        | `ruby --version`          | System Ruby or use `rbenv` / `rvm` |
| **Bundler**   | Latest           | `bundle --version`        | `gem install bundler` if missing |

---

## Project Setup

### Step 1 — Clone the Repository

```sh
git clone <repository-url>
cd ImageProcessor
```

### Step 2 — Install JavaScript Dependencies

```sh
yarn install
```

This installs all `node_modules` using Yarn 4 with the `node-modules` linker strategy.

> **Tip**: If you see a Corepack error, enable Corepack first:
> ```sh
> corepack enable
> ```

### Step 3 — (iOS Only) Install Ruby Gems and CocoaPods

This project manages CocoaPods via Bundler to ensure consistent versions across machines.

```sh
# Install Ruby gems (CocoaPods and its dependencies)
bundle install

# Install iOS native dependencies
cd ios
bundle exec pod install
cd ..
```

> **Important**: Always use `bundle exec pod install` instead of `pod install` directly to avoid CocoaPods version mismatches.

---

## Running on Android

### Step 1 — Start an Android Emulator

Open Android Studio → **Virtual Device Manager** → Start an emulator with **API 24 or higher**.

Alternatively, from the terminal:

```sh
emulator -list-avds               # List available AVDs
emulator -avd <avd_name>          # Start a specific AVD
```

Or connect a physical Android device via USB with **USB Debugging** enabled.

Verify your device is detected:

```sh
adb devices
```

You should see your device/emulator listed as `device` (not `unauthorized`).

### Step 2 — Start Metro Bundler

Open a terminal at the project root and run:

```sh
yarn start
```

Keep this terminal running. Metro is the JavaScript bundler that serves your JS bundle to the app.

### Step 3 — Build and Run the Android App

Open a **second terminal** at the project root and run:

```sh
yarn android
```

This will:
1. Run Codegen (generates native bindings from the Turbo Module spec)
2. Compile the Kotlin native module
3. Build the APK
4. Install it on the connected device/emulator
5. Launch the app

> **First build** may take 5–10 minutes while Gradle downloads dependencies and compiles native code. Subsequent builds are much faster.

### Verify

The app should launch on the emulator/device showing the **Gallery Screen** with a "Generate Thumbnails" button. Tap it to process the 26 bundled images into thumbnails.

---

## Running on iOS

> **Note**: iOS builds require macOS with Xcode installed.

### Step 1 — Ensure CocoaPods are Installed

If you haven't already done this during [Project Setup — Step 3](#step-3--ios-only-install-ruby-gems-and-cocoapods):

```sh
bundle install
cd ios
bundle exec pod install
cd ..
```

### Step 2 — Start Metro Bundler

Open a terminal at the project root and run:

```sh
yarn start
```

Keep this terminal running.

### Step 3 — Build and Run the iOS App

Open a **second terminal** at the project root and run:

```sh
yarn ios
```

This will:
1. Run Codegen (generates native bindings from the Turbo Module spec)
2. Compile the Swift native module
3. Build the app
4. Launch it on the default iOS Simulator

#### To run on a specific simulator:

```sh
yarn ios --simulator="iPhone 16"
```

#### To run on a physical device:

1. Open `ios/ImageProcessor.xcworkspace` in Xcode (not `.xcodeproj`)
2. Select your development team under **Signing & Capabilities**
3. Select your device from the device dropdown
4. Press **⌘R** to build and run

> **First build** may take 5–10 minutes while Xcode compiles native code and CocoaPods dependencies. Subsequent builds are much faster.

### Verify

The app should launch on the simulator showing the **Gallery Screen** with a "Generate Thumbnails" button.

---

## Project Structure

```
ImageProcessor/
├── App.tsx                          # App entry point (SafeAreaProvider + GalleryScreen)
├── index.js                         # React Native app registry
├── package.json                     # Dependencies & scripts (yarn-based)
├── tsconfig.json                    # TypeScript configuration
├── metro.config.js                  # Metro bundler configuration
├── Gemfile                          # Ruby gems (CocoaPods version management)
├── images/                          # 26 bundled source images (jpg/png)
│
├── src/
│   ├── specs/
│   │   └── NativeImageProcessor.ts  # Turbo Module Codegen spec
│   ├── hooks/
│   │   └── useImageProcessor.ts     # Custom hook wrapping the native module
│   ├── components/
│   │   ├── ImageCell.tsx            # Memoised FlatList cell (thumbnail + metadata)
│   │   ├── ImagePreviewModal.tsx    # Full-size image preview modal
│   │   └── ProgressBar.tsx          # Thumbnail generation progress indicator
│   ├── screens/
│   │   └── GalleryScreen.tsx        # Main gallery screen with FlatList grid
│   └── types/                       # Shared TypeScript type definitions
│
├── android/
│   └── app/src/main/java/com/imageprocessor/
│       └── ImageProcessorModule.kt  # Android Turbo Module (Kotlin)
│
└── ios/ImageProcessor/
    ├── ImageProcessorModule.swift   # iOS Turbo Module (Swift)
    ├── ImageProcessorModule.m       # ObjC bridge for Swift Turbo Module
    └── BundledImages/               # iOS bundled image assets
```

---

## Architecture & Design Decisions

### Turbo Module (New Architecture)

- The Turbo Module spec is defined in `src/specs/NativeImageProcessor.ts` and uses **Codegen** to generate type-safe native bindings.
- No legacy bridge modules are used — all native communication goes through the **JSI** (JavaScript Interface) for better performance.
- The `newArchEnabled=true` flag is set in `android/gradle.properties`.

### Native Implementations

- **iOS (Swift)**: Image processing uses `UIImage` / `CGImage` APIs. A bridging header (`ImageProcessor-Bridging-Header.h`) and ObjC wrapper (`ImageProcessorModule.m`) expose the Swift module to React Native.
- **Android (Kotlin)**: Image processing uses `BitmapFactory` and `Bitmap` APIs.
- Both platforms perform all image processing on **background threads** and emit progress events back to JS.
- `cancelProcessing()` sets a cancellation flag that is checked between each thumbnail in the batch.

### Custom Hook — `useImageProcessor`

- Wraps the native module with proper React lifecycle management.
- Subscribes to native progress events on mount and cleans up on unmount.
- Cancels in-flight native work on unmount to prevent memory leaks.
- Uses `useCallback` for stable function references across renders.
- Batches rapid native events to minimise render jank.

### FlatList Optimisation

- **3-column grid** layout with `getItemLayout` for O(1) scroll-to-index calculations.
- Each cell is wrapped in `React.memo` with a custom comparator — selecting/deselecting one item does **not** re-render unrelated cells.
- Uses `Set`-based selection state for O(1) lookups.
- Configured with `maxToRenderPerBatch`, `windowSize`, and `removeClippedSubviews` for optimal performance with 200+ items.

### Image Assets

- 26 source images (jpg/png) are bundled in the `images/` directory.
- On app launch, `copyBundledImages()` copies them to the device's temp/cache directory.
- These are duplicated in the data array to simulate **200+ gallery items**.

---

## Known Limitations

- **No external image libraries**: All image processing uses platform-native APIs only (per project requirements).
- **Image quality**: Thumbnail compression quality is fixed; no user-configurable quality slider.
- **No persistence**: Thumbnails are generated into the temp directory and are cleared when the app is uninstalled or the cache is purged.
- **iOS physical device**: Requires a valid Apple Developer signing team configured in Xcode.
- **Android first build**: Gradle may take significant time on the first build to download dependencies.

---

## Troubleshooting

### General

| Issue | Solution |
| ----- | -------- |
| `yarn install` fails with Corepack error | Run `corepack enable` first, then retry |
| Metro fails to start | Kill any existing Metro process: `lsof -ti:8081 \| xargs kill -9` |
| Module not found errors after `yarn install` | Delete `node_modules` and reinstall: `rm -rf node_modules && yarn install` |
| Codegen errors | Clean and rebuild: `yarn start --reset-cache` |

### Android

| Issue | Solution |
| ----- | -------- |
| `SDK location not found` | Create `android/local.properties` with: `sdk.dir=/Users/<username>/Library/Android/sdk` |
| `JAVA_HOME` not set or wrong version | Ensure JDK 17 is installed and `JAVA_HOME` points to it: `export JAVA_HOME=$(/usr/libexec/java_home -v 17)` |
| Build fails with NDK error | Verify NDK version `27.1.12297006` is installed via Android Studio SDK Manager |
| `adb devices` shows no devices | Ensure USB Debugging is enabled, or start an emulator from Android Studio |
| Gradle build hangs or is very slow | Increase memory in `android/gradle.properties`: `org.gradle.jvmargs=-Xmx4096m` |
| Clean rebuild needed | `cd android && ./gradlew clean && cd ..` then `yarn android` |

### iOS

| Issue | Solution |
| ----- | -------- |
| `pod install` fails | Ensure you run `bundle install` first, then use `bundle exec pod install` |
| `pod install` says "CDN: trunk URL couldn't be downloaded" | Run `bundle exec pod repo update` then retry |
| Xcode build fails with signing error | Open `.xcworkspace` in Xcode, select your dev team under Signing & Capabilities |
| Xcode build fails with "module not found" | Run `cd ios && bundle exec pod install --repo-update && cd ..` |
| Simulator not found | Run `xcrun simctl list devices available` to see available simulators, then pass the name: `yarn ios --simulator="iPhone 16"` |
| Build cache issues | Clean Xcode DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData` then rebuild |
| CocoaPods version mismatch | Always use `bundle exec pod install` — not `pod install` directly |

### Full Clean Rebuild (Nuclear Option)

If nothing else works, perform a complete clean:

```sh
# Remove all generated / cached files
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
rm -rf android/build
rm -rf android/app/build
rm -rf android/.gradle

# Reinstall everything
yarn install
cd ios && bundle exec pod install && cd ..

# Start fresh
yarn start --reset-cache

# Then in a new terminal:
yarn android   # or
yarn ios
```

---

## Available Scripts

| Command         | Description                                  |
| --------------- | -------------------------------------------- |
| `yarn install`  | Install all JavaScript dependencies          |
| `yarn start`    | Start the Metro bundler                      |
| `yarn android`  | Build and run on Android emulator/device     |
| `yarn ios`      | Build and run on iOS Simulator               |
| `yarn lint`     | Run ESLint on the codebase                   |
| `yarn test`     | Run Jest unit tests                          |

---

## Learn More

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Native New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page)
- [Turbo Modules](https://reactnative.dev/docs/turbo-native-modules-introduction)
- [Environment Setup Guide](https://reactnative.dev/docs/set-up-your-environment)
- [Troubleshooting](https://reactnative.dev/docs/troubleshooting)
