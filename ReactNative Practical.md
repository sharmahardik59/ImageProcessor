# React Native Practical Test

## Native Image Processor — Turbo Module + Optimized Gallery

**Duration:** 4 Hours  
**Type:** Take-home assignment  
**Submission:** Zip file submission in email

---

## Objective

Build a React Native application from scratch that implements a native image processing module using Turbo Modules (New Architecture) for both iOS and Android. Consume the module via a custom React hook and display results in an optimized FlatList gallery.

---

## Tech Requirements

- React Native 0.81+
- New Architecture enabled (Turbo Modules with Codegen)
- iOS: Swift
- Android: Kotlin
- TypeScript 
- Must run on iOS Simulator and Android Emulator

---

## Part 1 — Project Setup & Turbo Module Spec

1. Create a new React Native project with New Architecture enabled on both platforms.
2. Define a Turbo Module Codegen spec that exposes:
   - `resizeImage(uri, maxWidth, maxHeight, quality)` → returns new file URI
   - `getImageMetadata(uri)` → returns width, height, fileSize, mimeType
   - `generateThumbnails(uris[], thumbSize)` → processes batch, emits progress events, returns all URIs
   - `cancelProcessing()` → cancels ongoing batch
   - Event emitter support for progress reporting
3. Verify the project builds and runs on both platforms.

**Constraints:**
- No legacy bridge modules
- No external image processing libraries

---

## Part 2 — Native Implementation (iOS + Android)

Implement the Turbo Module on both platforms.

### Image Source

Include 10–20 .jpg/.png files in your project assets. On app launch, copy them to the device's temp/cache directory and use those file URIs.

You must have at least 10–20 valid image file URIs available to pass into the native module. For the FlatList in Part 4, duplicate these to simulate 200+ items.

### Functional requirements:
- `resizeImage`: Maintain aspect ratio, write to temp directory, return URI
- `getImageMetadata`: Return dimensions and file info without loading full image into memory
- `generateThumbnails`: Process array into square thumbnails, emit progress event (`completed`, `total`, `lastUri`) after each item, return all URIs on completion
- `cancelProcessing`: Stop in-progress batch — remaining items must not be processed

**Non-functional requirements:**
- All processing on background threads
- Proper memory management
- Meaningful error handling with rejection codes

---

## Part 3 — Custom Hook: `useImageProcessor`

Create a hook that wraps the native module and returns:
- `thumbnails: string[]`
- `isProcessing: boolean`
- `progress: { completed: number; total: number }`
- `processBatch(uris[], thumbSize?): void`
- `cancel(): void`

**Requirements:**
- Proper lifecycle management for native event subscriptions
- Cancel native work on unmount
- Handle rapid native events without causing render jank
- Stable function references across renders
- No stale closure bugs

---

## App Flow

The app is a single screen — a gallery dashboard that processes source images into thumbnails and displays them in a grid.

### Sequence of Operations:

1. App launches → 10–20 source image file URIs are available (bundled or picked)
2. User taps a **"Generate Thumbnails"** button
3. Hook calls `generateThumbnails(uris, 150)` → native starts batch processing on a background thread
4. As each thumbnail completes → native emits a progress event → **progress bar** updates at the top of the screen
5. Each completed thumbnail appears in the FlatList grid (replacing its loading placeholder)
6. `getImageMetadata` is called per image to display dimensions and file size in each cell
7. User can tap **"Cancel"** during generation → calls `cancelProcessing()` → progress stops, remaining cells stay as placeholders
8. User can tap a single thumbnail → calls `resizeImage` to show a larger preview (a simple modal or inline expansion is fine)
9. User can long-press to enter multi-select mode, tap to toggle selection

### What Each FlatList Cell Shows:

- Thumbnail image (output of `generateThumbnails`)
- Metadata text: dimensions + file size (output of `getImageMetadata`)
- Loading skeleton/placeholder while that thumbnail is still processing
- Checkmark overlay when selected in multi-select mode

### When Each Native Method Is Called:

| Method | Trigger | UI Result |
|--------|---------|-----------|
| `generateThumbnails` | User taps "Generate" button | Progress bar fills, thumbnails appear in grid |
| `getImageMetadata` | Called per image after thumbnail is ready | Dimensions + size text shown in cell |
| `resizeImage` | User taps a thumbnail for preview | Larger version shown in modal/detail view |
| `cancelProcessing` | User taps "Cancel" during generation | Progress stops, remaining cells stay as placeholders |

---

## Part 4 — Optimized Gallery FlatList

Build the gallery grid displaying 200+ items in a 3-column layout.

Use 10–20 generated thumbnails duplicated in the data array to simulate 200+ items.

**Requirements:**
- FlatList configured for performance (layout calculation, render batching, clipped subviews)
- Each cell memoized with a custom comparator — selecting one item must not re-render unrelated cells
- Multi-select via long-press/tap using Set-based selection state
- Header with selected count and "Delete Selected" action
- All press handlers must maintain reference stability across renders

---

## Submission

1. Zip file of the GitHub repo with meaningful commit history (Do not push to github.com)
2. README with: build/run steps, design decisions, known limitations
3. Screenshot or screen recording showing the app running on both iOS Simulator and Android Emulator

---

## Rules

- No external image processing libraries
- No legacy bridge modules — Turbo Modules only

---

## Evaluation Areas

- New Architecture setup and Codegen
- Native implementation (threading, memory, errors)
- React hooks lifecycle and performance patterns
- FlatList optimization and minimal re-renders
- Code quality and architecture

---

Good luck!
