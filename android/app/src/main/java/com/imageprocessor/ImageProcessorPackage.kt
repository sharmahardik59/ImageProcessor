package com.imageprocessor

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class ImageProcessorPackage : TurboReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    when (name) {
      ImageProcessorModule.NAME -> ImageProcessorModule(reactContext)
      else -> null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      mapOf(
        ImageProcessorModule.NAME to ReactModuleInfo(
          ImageProcessorModule.NAME,
          ImageProcessorModule::class.java.name,
          true,  // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true,  // isTurboModule
        )
      )
    }
}
