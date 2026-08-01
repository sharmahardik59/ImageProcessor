export type ImageMetadata = {
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
};

export type GalleryItem = {
  id: string;
  sourceUri: string;
  thumbnailUri: string | null;
  metadata: ImageMetadata | null;
  index: number;
};

export type ProgressInfo = {
  completed: number;
  total: number;
};
