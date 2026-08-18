#import "ImageProcessor.h"
#import <React_RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import <React_RCTAppDelegate/RCTReactNativeFactory.h>
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#import <ReactCodegen/NativeImageProcessorSpec/NativeImageProcessorSpec.h>
#import "ImageProcessor-Swift.h"

@interface ImageProcessor ()
@property (nonatomic, strong) ImageProcessorSwiftModule *swiftModule;
@end

@implementation ImageProcessor

RCT_EXPORT_MODULE(ImageProcessor)

- (instancetype)init
{
  if (self = [super init]) {
    _swiftModule = [[ImageProcessorSwiftModule alloc] init];
    __weak ImageProcessor *weakSelf = self;
    _swiftModule.onProgressCallback = ^(NSDictionary *progress) {
      [weakSelf sendProgressEvent:progress];
    };
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onProgress"];
}

- (void)sendProgressEvent:(NSDictionary *)body
{
  if (self.bridge != nil || [self respondsToSelector:@selector(callableJSModules)]) {
    [self sendEventWithName:@"onProgress" body:body];
  }
}

- (void)resizeImage:(NSString *)uri
           maxWidth:(double)maxWidth
          maxHeight:(double)maxHeight
            quality:(double)quality
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject
{
  [self.swiftModule resizeImage:uri
                       maxWidth:maxWidth
                      maxHeight:maxHeight
                        quality:quality
                        resolve:resolve
                         reject:reject];
}

- (void)getImageMetadata:(NSString *)uri
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject
{
  [self.swiftModule getImageMetadata:uri
                             resolve:resolve
                              reject:reject];
}

- (void)generateThumbnails:(NSArray *)uris
                 thumbSize:(double)thumbSize
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  [self.swiftModule generateThumbnails:uris
                             thumbSize:thumbSize
                               resolve:resolve
                                reject:reject];
}

- (void)cancelProcessing
{
  [self.swiftModule cancelProcessing];
}

- (void)copyBundledImages:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
{
  [self.swiftModule copyBundledImages:resolve
                               reject:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeImageProcessorSpecJSI>(params);
}

@end
