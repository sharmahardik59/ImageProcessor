import { NativeEventEmitter } from 'react-native';
import NativeImageProcessor from '../specs/NativeImageProcessor';
import type { ImageMetadata, ProgressInfo } from '../types';

export type ProgressEvent = ProgressInfo & {
  lastUri: string;
};

class ImageProcessorService {
  private emitter: NativeEventEmitter;

  constructor() {
    this.emitter = new NativeEventEmitter(NativeImageProcessor);
  }

  generateThumbnails(uris: string[], thumbSize = 150): Promise<string[]> {
    return NativeImageProcessor.generateThumbnails(uris, thumbSize);
  }

  resizeImage(
    uri: string,
    maxWidth: number,
    maxHeight: number,
    quality: number,
  ): Promise<string> {
    return NativeImageProcessor.resizeImage(uri, maxWidth, maxHeight, quality);
  }

  getImageMetadata(uri: string): Promise<ImageMetadata> {
    return NativeImageProcessor.getImageMetadata(uri);
  }

  copyBundledImages(): Promise<string[]> {
    return NativeImageProcessor.copyBundledImages();
  }

  cancelProcessing(): void {
    NativeImageProcessor.cancelProcessing();
  }

  onProgress(listener: (event: ProgressEvent) => void) {
    return this.emitter.addListener('onProgress', listener);
  }
}

export default new ImageProcessorService();
