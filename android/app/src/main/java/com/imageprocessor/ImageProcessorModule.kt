package com.imageprocessor

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

@ReactModule(name = ImageProcessorModule.NAME)
class ImageProcessorModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext),
    TurboModule {

    companion object {
        const val NAME = "ImageProcessor"
        private const val SUPPORTED_EXTENSIONS = "png,jpeg,jpg"
        private const val TARGET_IMAGE_COUNT = 234
    }

    override fun getName(): String = NAME

    override fun invalidate() {
        bgExecutor.shutdown()
    }

    private val bgExecutor = Executors.newSingleThreadExecutor()
    private val cancelled = AtomicBoolean(false)
    private var listenerCount = 0

    @ReactMethod
    fun copyBundledImages(promise: Promise) {
        bgExecutor.execute {
            try {
                val destDir = File(reactContext.cacheDir, "BundledImagesCopy")
                if (destDir.exists()) destDir.deleteRecursively()
                destDir.mkdirs()

                val assets = reactContext.assets
                val imageFiles = assets.list("")
                    ?.filter { name ->
                        val ext = name.substringAfterLast(".", "").lowercase()
                        ext in SUPPORTED_EXTENSIONS.split(",")
                    }
                    ?.sorted()
                    ?: emptyList()

                if (imageFiles.isEmpty()) {
                    promise.reject("E_NO_IMAGES", "No image files found in assets")
                    return@execute
                }

                val copiesPerFile = (TARGET_IMAGE_COUNT / imageFiles.size).coerceAtLeast(1)
                val uris = mutableListOf<String>()

                for ((idx, filename) in imageFiles.withIndex()) {
                    val ext = filename.substringAfterLast(".", "")
                    for (copy in 0 until copiesPerFile) {
                        val outFile = File(destDir, "img_${idx + 1}_copy_$copy.$ext")
                        assets.open(filename).use { input ->
                            FileOutputStream(outFile).use { output -> input.copyTo(output) }
                        }
                        uris.add(Uri.fromFile(outFile).toString())
                    }
                }

                uris.shuffle()

                val result = Arguments.createArray()
                uris.forEach { result.pushString(it) }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("E_COPY_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun resizeImage(uri: String, maxWidth: Double, maxHeight: Double, quality: Double, promise: Promise) {
        bgExecutor.execute {
            try {
                val stream = openStream(uri)
                if (stream == null) {
                    promise.reject("E_INVALID_URI", "Can't open: $uri")
                    return@execute
                }

                val original = BitmapFactory.decodeStream(stream)
                stream.close()
                if (original == null) {
                    promise.reject("E_DECODE", "Failed to decode image")
                    return@execute
                }

                val scale = minOf(maxWidth / original.width, maxHeight / original.height, 1.0)
                val w = (original.width * scale).toInt()
                val h = (original.height * scale).toInt()

                val resized = Bitmap.createScaledBitmap(original, w, h, true)
                if (resized !== original) original.recycle()

                val outputUri = writeBitmapToCache(resized, uri, quality.toInt(), "resized")
                resized.recycle()

                promise.resolve(outputUri)
            } catch (e: Exception) {
                promise.reject("E_RESIZE_FAILED", "Resize error: ${e.message}", e)
            }
        }
    }

    @ReactMethod
    fun getImageMetadata(uri: String, promise: Promise) {
        bgExecutor.execute {
            try {
                val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                val stream = openStream(uri)
                if (stream == null) {
                    promise.reject("E_INVALID_URI", "Can't open: $uri")
                    return@execute
                }
                BitmapFactory.decodeStream(stream, null, opts)
                stream.close()

                var fileSize = 0L
                val parsed = Uri.parse(uri)
                if (parsed.scheme == "file") {
                    fileSize = File(parsed.path!!).length()
                } else {
                    val sizeStream = openStream(uri)
                    fileSize = sizeStream?.available()?.toLong() ?: 0
                    sizeStream?.close()
                }

                val mimeType = when (uri.substringAfterLast(".").lowercase()) {
                    "png" -> "image/png"
                    "jpg", "jpeg" -> "image/jpeg"
                    else -> "image/unknown"
                }

                val map = Arguments.createMap().apply {
                    putInt("width", opts.outWidth)
                    putInt("height", opts.outHeight)
                    putDouble("fileSize", fileSize.toDouble())
                    putString("mimeType", mimeType)
                }
                promise.resolve(map)
            } catch (e: Exception) {
                promise.reject("E_METADATA_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun generateThumbnails(uris: ReadableArray, thumbSize: Double, promise: Promise) {
        cancelled.set(false)

        bgExecutor.execute {
            val results = Arguments.createArray()
            val total = uris.size()
            val size = thumbSize.toInt()

            for (i in 0 until total) {
                if (cancelled.get()) {
                    promise.resolve(results)
                    return@execute
                }

                val uri = uris.getString(i)
                if (uri.isNullOrEmpty()) {
                    results.pushString("")
                    continue
                }

                try {
                    val stream = openStream(uri)
                    if (stream == null) {
                        results.pushString("")
                        continue
                    }

                    val bmp = BitmapFactory.decodeStream(stream)
                    stream.close()
                    if (bmp == null) {
                        results.pushString("")
                        continue
                    }

                    val minDim = minOf(bmp.width, bmp.height)
                    val x = (bmp.width - minDim) / 2
                    val y = (bmp.height - minDim) / 2
                    val cropped = Bitmap.createBitmap(bmp, x, y, minDim, minDim)
                    if (cropped !== bmp) bmp.recycle()

                    val thumb = Bitmap.createScaledBitmap(cropped, size, size, true)
                    if (thumb !== cropped) cropped.recycle()

                    val thumbUri = writeBitmapToCache(thumb, uri, 80, "thumb_$i")
                    thumb.recycle()
                    results.pushString(thumbUri)

                    emitProgress(i + 1, total, thumbUri)
                } catch (e: Exception) {
                    results.pushString("")
                }
            }

            promise.resolve(results)
        }
    }

    @ReactMethod
    fun cancelProcessing() {
        cancelled.set(true)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount++
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        listenerCount = (listenerCount - count.toInt()).coerceAtLeast(0)
    }

    private fun emitProgress(completed: Int, total: Int, lastUri: String) {
        if (!reactContext.hasActiveReactInstance()) return
        val params = Arguments.createMap().apply {
            putInt("completed", completed)
            putInt("total", total)
            putString("lastUri", lastUri)
        }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onProgress", params)
    }

    private fun openStream(uri: String): java.io.InputStream? {
        return try {
            val parsed = Uri.parse(uri)
            when (parsed.scheme) {
                "file" -> File(parsed.path!!).inputStream()
                "content" -> reactContext.contentResolver.openInputStream(parsed)
                else -> File(uri).inputStream()
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun writeBitmapToCache(
        bitmap: Bitmap,
        originalUri: String,
        quality: Int,
        prefix: String
    ): String {
        val isJpeg = originalUri.lowercase().let { it.endsWith(".jpeg") || it.endsWith(".jpg") }
        val ext = if (isJpeg) "jpeg" else "png"
        val format = if (isJpeg) Bitmap.CompressFormat.JPEG else Bitmap.CompressFormat.PNG

        val outFile = File(reactContext.cacheDir, "${prefix}_${UUID.randomUUID()}.$ext")
        FileOutputStream(outFile).use { out ->
            bitmap.compress(format, quality, out)
        }
        return Uri.fromFile(outFile).toString()
    }
}
