import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useImageProcessor } from '../src/hooks/useImageProcessor';
import { ImageProcessor } from '../src/services';

type HookResult = ReturnType<typeof useImageProcessor>;

function TestComponent(props: { onHook: (hook: HookResult) => void }) {
  const hook = useImageProcessor();
  React.useEffect(() => {
    props.onHook(hook);
  }, [hook, props]);
  return null;
}

describe('useImageProcessor Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default states', async () => {
    let hookResult: HookResult | null = null;
    const handleHook = (h: HookResult) => {
      hookResult = h;
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<TestComponent onHook={handleHook} />);
    });

    expect(hookResult).not.toBeNull();
    if (hookResult) {
      const res = hookResult as HookResult;
      expect(res.thumbnails).toEqual([]);
      expect(res.isProcessing).toBe(false);
      expect(res.progress).toEqual({ completed: 0, total: 0 });
    }
  });

  it('should batch process images and update state', async () => {
    let hookResult: HookResult | null = null;
    const handleHook = (h: HookResult) => {
      hookResult = h;
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<TestComponent onHook={handleHook} />);
    });

    const uris = ['file:///path/to/img1.jpg'];

    await ReactTestRenderer.act(async () => {
      if (hookResult) {
        await hookResult.processBatch(uris, 150);
      }
    });

    expect(hookResult).not.toBeNull();
    if (hookResult) {
      const res = hookResult as HookResult;
      expect(res.thumbnails).toEqual(['file:///tmp/thumb_0.jpg']);
      expect(res.isProcessing).toBe(false);
      expect(res.progress).toEqual({ completed: 1, total: 1 });
    }
  });

  it('should cancel processing on unmount', async () => {
    const spy = jest.spyOn(ImageProcessor, 'cancelProcessing');
    let renderer: ReactTestRenderer.ReactTestRenderer | null = null;
    const handleHook = (_h: HookResult) => {};

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<TestComponent onHook={handleHook} />);
    });

    await ReactTestRenderer.act(async () => {
      if (renderer) {
        renderer.unmount();
      }
    });

    expect(spy).toHaveBeenCalled();
  });
});
