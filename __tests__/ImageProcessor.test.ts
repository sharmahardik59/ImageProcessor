import { ImageProcessor } from '../src/services';
import NativeImageProcessor from '../src/specs/NativeImageProcessor';

describe('ImageProcessor Service (Direct JSI TurboModule)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call generateThumbnails on NativeImageProcessor', async () => {
    const uris = ['file:///path/to/img1.jpg', 'file:///path/to/img2.jpg'];
    const result = await ImageProcessor.generateThumbnails(uris, 150);

    expect(NativeImageProcessor.generateThumbnails).toHaveBeenCalledWith(uris, 150);
    expect(result).toEqual(['file:///tmp/thumb_0.jpg']);
  });

  it('should call resizeImage on NativeImageProcessor', async () => {
    const uri = 'file:///path/to/img.jpg';
    const result = await ImageProcessor.resizeImage(uri, 400, 400, 90);

    expect(NativeImageProcessor.resizeImage).toHaveBeenCalledWith(uri, 400, 400, 90);
    expect(result).toBe('file:///tmp/resized.jpg');
  });

  it('should call getImageMetadata on NativeImageProcessor', async () => {
    const uri = 'file:///path/to/img.jpg';
    const metadata = await ImageProcessor.getImageMetadata(uri);

    expect(NativeImageProcessor.getImageMetadata).toHaveBeenCalledWith(uri);
    expect(metadata).toEqual({
      width: 800,
      height: 600,
      fileSize: 102400,
      mimeType: 'image/jpeg',
    });
  });

  it('should call copyBundledImages on NativeImageProcessor', async () => {
    const result = await ImageProcessor.copyBundledImages();

    expect(NativeImageProcessor.copyBundledImages).toHaveBeenCalled();
    expect(result).toEqual(['file:///tmp/img_1.jpg']);
  });

  it('should cancel processing when cancelProcessing is called', () => {
    ImageProcessor.cancelProcessing();
    expect(NativeImageProcessor.cancelProcessing).toHaveBeenCalled();
  });

  it('should support event listener subscriptions', () => {
    const listener = jest.fn();
    const sub = ImageProcessor.onProgress(listener);

    expect(sub).toBeDefined();
    expect(typeof sub.remove).toBe('function');
    sub.remove();
  });
});
