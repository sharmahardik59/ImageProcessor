#import <React/RCTEventEmitter.h>
#import <ReactCodegen/NativeImageProcessorSpec/NativeImageProcessorSpec.h>

@interface ImageProcessor : RCTEventEmitter <NativeImageProcessorSpec>

- (void)sendProgressEvent:(NSDictionary *)body;

@end
