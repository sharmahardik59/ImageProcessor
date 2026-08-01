import {useState, useEffect, useCallback, useRef} from 'react';
import {NativeEventEmitter, NativeModules, Platform} from 'react-native';
import type {ImageMetadata, ProgressInfo} from '../types';

const {ImageProcessor} = NativeModules;

const eventEmitter = new NativeEventEmitter(
  Platform.OS === 'ios' ? ImageProcessor : undefined,
);

export function useImageProcessor() {
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo>({completed: 0, total: 0});

  const thumbnailsRef = useRef<(string | null)[]>([]);
  const mountedRef = useRef(true);
  const gotEventsRef = useRef(false);

  // Listen for per-image progress events from native
  useEffect(() => {
    const sub = eventEmitter.addListener('onProgress', (event: any) => {
      if (!mountedRef.current) return;

      gotEventsRef.current = true;
      const {completed, total, lastUri} = event;

      setProgress({completed, total});

      // Update the thumbnail at this index
      const idx = completed - 1;
      if (idx >= 0 && idx < thumbnailsRef.current.length) {
        thumbnailsRef.current[idx] = lastUri;
        // Batch state updates — only push to React every 5 items (or on the last one)
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
      try { ImageProcessor.cancelProcessing(); } catch {}
    };
  }, []);

  const processBatch = useCallback(
    async (uris: string[], thumbSize: number = 150) => {
      if (!mountedRef.current) return;

      gotEventsRef.current = false;
      setIsProcessing(true);
      setProgress({completed: 0, total: uris.length});

      const blanks = new Array(uris.length).fill(null);
      thumbnailsRef.current = blanks;
      setThumbnails(blanks);

      try {
        const result: string[] = await ImageProcessor.generateThumbnails(uris, thumbSize);
        if (!mountedRef.current) return;

        if (!gotEventsRef.current && result.length > 0) {
          // Events didn't fire (can happen on some Android builds) —
          // animate the reveal in small batches so the UI doesn't just flash
          const batchSize = 10;
          let revealed = 0;

          const revealNext = () => {
            if (!mountedRef.current) return;
            const end = Math.min(revealed + batchSize, result.length);
            for (let i = revealed; i < end; i++) {
              thumbnailsRef.current[i] = result[i];
            }
            revealed = end;
            setThumbnails([...thumbnailsRef.current]);
            setProgress({completed: revealed, total: result.length});

            if (revealed < result.length) {
              requestAnimationFrame(revealNext);
            } else {
              setIsProcessing(false);
            }
          };
          requestAnimationFrame(revealNext);
        } else {
          thumbnailsRef.current = result;
          setThumbnails([...result]);
          setProgress({completed: result.length, total: uris.length});
          setIsProcessing(false);
        }
      } catch {
        if (mountedRef.current) setIsProcessing(false);
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    ImageProcessor.cancelProcessing();
    setIsProcessing(false);
  }, []);

  const resizeImage = useCallback(
    (uri: string, maxW: number, maxH: number, quality: number): Promise<string> => {
      return ImageProcessor.resizeImage(uri, maxW, maxH, quality);
    },
    [],
  );

  const getImageMetadata = useCallback(
    (uri: string): Promise<ImageMetadata> => {
      return ImageProcessor.getImageMetadata(uri);
    },
    [],
  );

  const copyBundledImages = useCallback((): Promise<string[]> => {
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
