# ImageProcessor

A React Native project featuring a high-performance native image processing module built with **React Native 0.86 (New Architecture)** using **Direct JSI TurboModules**, **Bridgeless Mode**, and **Fabric rendering**.

The app processes local image assets (batch thumbnail generation, resizing, metadata extraction) on background native threads and streams real-time progress events over JSI to an optimized gallery grid.

---

## Features

- **Direct JSI Execution**: Native calls bypass the legacy bridge entirely and execute directly over the JavaScript Interface (JSI).
- **Background Image Processing**:
  - Batch thumbnail generation with center-crop and aspect ratio preservation.
  - Image downscaling with custom dimension bounds and JPEG compression quality.
  - Fast metadata reading without full bitmap loading.
  - Cancellable batch operations.
- **Native Event Streaming**: Live progress events (`onProgress`) emitted directly to JavaScript listeners.
- **Optimized UI**: 3-column FlatList gallery leveraging Fabric's rendering engine, batched state updates, and memoized cell components.

---

## Architecture Overview

```
JavaScript / TypeScript UI Layer
  ├── GalleryScreen & ImageCell (Fabric Rendered)
  ├── useImageProcessor (Custom React Hook)
  └── ImageProcessorService (Singleton with NativeEventEmitter)
                  │
                  ▼
      src/specs/NativeImageProcessor.ts (Codegen Spec)
                  │
         ┌────────┴────────┐
         ▼                 ▼
   iOS (Direct JSI)    Android (Direct JSI)
  ImageProcessor.mm     ImageProcessorModule.kt
         │                 │
  ImageProcessorModule  TurboReactPackage
       (Swift)
```

- **Spec**: `src/specs/NativeImageProcessor.ts` defines the type-safe `Spec extends TurboModule` and calls `TurboModuleRegistry.getEnforcing<Spec>('ImageProcessor')`.
- **iOS (`ios/ImageProcessor/`)**:
  - `ImageProcessor.h` / `ImageProcessor.mm`: Objective-C++ TurboModule conforming to `<NativeImageProcessorSpec>` and `RCTEventEmitter`, returning `NativeImageProcessorSpecJSI`.
  - `ImageProcessorModule.swift`: High-performance image processing using `UIGraphicsImageRenderer` and `CGImageSource` on a dedicated serial background `DispatchQueue`.
- **Android (`android/app/src/main/java/com/imageprocessor/`)**:
  - `ImageProcessorModule.kt`: Kotlin TurboModule executing image decodes/resizes on a background `ExecutorService` and emitting progress via `RCTDeviceEventEmitter`.
  - `ImageProcessorPackage.kt`: Registers the module as a TurboModule (`isTurboModule = true`).

---

## Requirements

### Global
- **Node.js**: `>= 22.11.0`
- **Yarn**: `4.x` (Berry with `nodeLinker: node-modules`)

### iOS Development (macOS)
- **Xcode**: 15 or newer
- **CocoaPods**: `>= 1.15.0`
- **iOS Deployment Target**: iOS 15.1+

### Android Development
- **JDK**: 17
- **Android SDK**: Compile SDK 36 / Target SDK 34
- **NDK**: 27.x

---

## Getting Started

### 1. Install Dependencies

```bash
yarn install
```

### 2. iOS Setup & Run

Install CocoaPods and generated Codegen dependencies:

```bash
cd ios
pod install
cd ..
```

Start Metro bundler in one terminal:

```bash
yarn start
```

Run the app on the iOS Simulator in a second terminal:

```bash
yarn ios --simulator="iPhone 17 Pro"
```

To run on a default simulator, simply use `yarn ios`.

### 3. Android Setup & Run

Ensure an Android emulator is running or a device is connected with USB debugging enabled (`adb devices`).

Start Metro bundler:

```bash
yarn start
```

Build and install on Android:

```bash
yarn android
```

---

## Project Structure

```
ImageProcessor/
├── App.tsx                          # Root component with SafeAreaProvider
├── index.js                         # React Native registration
├── package.json                     # Project scripts and dependencies
├── tsconfig.json                    # TypeScript configuration
├── images/                          # Bundled source images
│
├── src/
│   ├── specs/
│   │   └── NativeImageProcessor.ts  # TurboModule Codegen spec
│   ├── services/
│   │   ├── ImageProcessor.ts        # Direct JSI module wrapper & EventEmitter
│   │   └── index.ts
│   ├── hooks/
│   │   └── useImageProcessor.ts     # Lifecycle-aware hook for gallery state
│   ├── components/
│   │   ├── ImageCell.tsx            # Memoized gallery cell component
│   │   ├── ImagePreviewModal.tsx    # Full-size image viewer modal
│   │   └── ProgressBar.tsx          # Real-time thumbnail progress bar
│   ├── screens/
│   │   ├── GalleryScreen.tsx        # Main gallery grid screen
│   │   └── GalleryScreen.styles.ts
│   └── types/
│       └── index.ts                 # Shared TypeScript interfaces
│
├── ios/
│   ├── Podfile                      # Fabric and Hermes configuration
│   └── ImageProcessor/
│       ├── AppDelegate.swift        # Bridgeless entry point (RCTReactNativeFactory)
│       ├── ImageProcessor.h         # Obj-C TurboModule header
│       ├── ImageProcessor.mm        # Objective-C++ JSI registration & events
│       └── ImageProcessorModule.swift # Swift CoreGraphics image processor
│
└── android/
    ├── gradle.properties            # newArchEnabled=true & hermesEnabled=true
    └── app/src/main/java/com/imageprocessor/
        ├── MainApplication.kt      # Bridgeless entry point (DefaultReactHost)
        ├── ImageProcessorPackage.kt # TurboReactPackage registration
        └── ImageProcessorModule.kt  # Kotlin background TurboModule
```

---

## Scripts & Quality Checks

| Command | Description |
| :--- | :--- |
| `yarn start` | Starts the Metro development server |
| `yarn ios` | Builds and launches the iOS app |
| `yarn android` | Builds and launches the Android app |
| `yarn tsc --noEmit` | Runs TypeScript type checking |
| `yarn lint` | Runs ESLint validation |
| `yarn test` | Executes Jest unit test suite |

---

## Troubleshooting

- **Clean iOS Build**:
  ```bash
  cd ios && rm -rf Pods Podfile.lock build && pod install && cd ..
  yarn start --reset-cache
  ```
- **Clean Android Build**:
  ```bash
  cd android && ./gradlew clean && cd ..
  yarn start --reset-cache
  ```
- **Port 8081 in use**:
  ```bash
  lsof -ti:8081 | xargs kill -9
  ```
