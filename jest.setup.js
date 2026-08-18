/* eslint-env jest */

// Mock NativeImageProcessor TurboModule for unit tests
jest.mock('./src/specs/NativeImageProcessor', () => ({
  __esModule: true,
  default: {
    resizeImage: jest.fn().mockResolvedValue('file:///tmp/resized.jpg'),
    getImageMetadata: jest.fn().mockResolvedValue({
      width: 800,
      height: 600,
      fileSize: 102400,
      mimeType: 'image/jpeg',
    }),
    generateThumbnails: jest.fn().mockResolvedValue(['file:///tmp/thumb_0.jpg']),
    cancelProcessing: jest.fn(),
    copyBundledImages: jest.fn().mockResolvedValue(['file:///tmp/img_1.jpg']),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));
