import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export type ImageMetadata = {
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
};

export interface Spec extends TurboModule {
  // Image operations
  resizeImage(uri: string, maxWidth: number, maxHeight: number, quality: number): Promise<string>;
  getImageMetadata(uri: string): Promise<ImageMetadata>;
  generateThumbnails(uris: string[], thumbSize: number): Promise<string[]>;
  cancelProcessing(): void;

  // Asset helpers
  copyBundledImages(): Promise<string[]>;

  // RN event emitter boilerplate
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ImageProcessor');
