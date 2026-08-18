import { useState, useEffect, useCallback, useRef } from 'react';
import type { ImageMetadata, ProgressInfo } from '../types';
import { ImageProcessor } from '../services';
import type { ProgressEvent } from '../services';

export function useImageProcessor() {
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo>({
    completed: 0,
    total: 0,
  });

  const thumbnailsRef = useRef<(string | null)[]>([]);
  const mountedRef = useRef(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const sub = ImageProcessor.onProgress((event: ProgressEvent) => {
      if (!mountedRef.current || cancelledRef.current) return;

      const { completed, total, lastUri } = event;
      setProgress({ completed, total });

      const idx = completed - 1;
      if (idx >= 0 && idx < thumbnailsRef.current.length) {
        thumbnailsRef.current[idx] = lastUri;
        if (completed % 5 === 0 || completed === total) {
          setThumbnails([...thumbnailsRef.current]);
        }
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      ImageProcessor.cancelProcessing();
    };
  }, []);

  const processBatch = useCallback(
    async (uris: string[], thumbSize = 150) => {
      if (!mountedRef.current) return;

      cancelledRef.current = false;
      setIsProcessing(true);
      setProgress({ completed: 0, total: uris.length });

      const blanks = new Array(uris.length).fill(null);
      thumbnailsRef.current = blanks;
      setThumbnails(blanks);

      try {
        const result = await ImageProcessor.generateThumbnails(uris, thumbSize);
        if (!mountedRef.current || cancelledRef.current) return;

        thumbnailsRef.current = result;
        setThumbnails([...result]);
        setProgress({ completed: result.length, total: uris.length });
        setIsProcessing(false);
      } catch {
        if (mountedRef.current) setIsProcessing(false);
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    ImageProcessor.cancelProcessing();
    setIsProcessing(false);
  }, []);

  const resizeImage = useCallback(
    (uri: string, maxW: number, maxH: number, quality: number) => {
      return ImageProcessor.resizeImage(uri, maxW, maxH, quality);
    },
    [],
  );

  const getImageMetadata = useCallback((uri: string): Promise<ImageMetadata> => {
    return ImageProcessor.getImageMetadata(uri);
  }, []);

  const copyBundledImages = useCallback(() => {
    return ImageProcessor.copyBundledImages();
  }, []);

  return {
    thumbnails,
    isProcessing,
    progress,
    processBatch,
    cancel,
    resizeImage,
    getImageMetadata,
    copyBundledImages,
  };
}
