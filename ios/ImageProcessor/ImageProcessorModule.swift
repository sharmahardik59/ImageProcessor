import Foundation
import UIKit
import React

@objc(ImageProcessorSwiftModule)
public class ImageProcessorSwiftModule: NSObject {

  private var isCancelled = false
  @objc public var onProgressCallback: (([String: Any]) -> Void)?

  private let queue = DispatchQueue(label: "com.imageprocessor.work", qos: .userInitiated)

  @objc public override init() {
    super.init()
  }

  @objc public func copyBundledImages(_ resolve: @escaping RCTPromiseResolveBlock,
                                      reject: @escaping RCTPromiseRejectBlock) {
    queue.async {
      do {
        let fm = FileManager.default
        let cacheDir = fm.urls(for: .cachesDirectory, in: .userDomainMask)[0]
          .appendingPathComponent("BundledImagesCopy", isDirectory: true)

        if fm.fileExists(atPath: cacheDir.path) {
          try fm.removeItem(at: cacheDir)
        }
        try fm.createDirectory(at: cacheDir, withIntermediateDirectories: true)

        guard let bundlePath = Bundle.main.path(forResource: "BundledImages", ofType: nil) else {
          reject("E_NO_BUNDLE", "BundledImages folder not in app bundle", nil)
          return
        }

        let imageFiles = try fm.contentsOfDirectory(atPath: bundlePath)
          .filter { $0.hasSuffix(".png") || $0.hasSuffix(".jpeg") || $0.hasSuffix(".jpg") }
          .sorted()

        guard !imageFiles.isEmpty else {
          reject("E_NO_IMAGES", "No images found in BundledImages", nil)
          return
        }

        let targetCount = 234
        let copiesEach = max(1, targetCount / imageFiles.count)
        var uris: [String] = []

        for (i, filename) in imageFiles.enumerated() {
          let srcPath = (bundlePath as NSString).appendingPathComponent(filename)
          let ext = (filename as NSString).pathExtension

          for c in 0..<copiesEach {
            let destURL = cacheDir.appendingPathComponent("img_\(i + 1)_copy_\(c).\(ext)")
            try fm.copyItem(atPath: srcPath, toPath: destURL.path)
            uris.append("file://" + destURL.path)
          }
        }

        uris.shuffle()
        resolve(uris)
      } catch {
        reject("E_COPY_FAILED", error.localizedDescription, error)
      }
    }
  }

  @objc public func resizeImage(_ uri: String,
                                maxWidth: Double,
                                maxHeight: Double,
                                quality: Double,
                                resolve: @escaping RCTPromiseResolveBlock,
                                reject: @escaping RCTPromiseRejectBlock) {
    queue.async {
      guard let url = URL(string: uri),
            let data = try? Data(contentsOf: url),
            let image = UIImage(data: data) else {
        reject("E_INVALID_URI", "Can't load image: \(uri)", nil)
        return
      }

      let origSize = image.size
      let scale = min(CGFloat(maxWidth) / origSize.width,
                      CGFloat(maxHeight) / origSize.height,
                      1.0)
      let newSize = CGSize(width: origSize.width * scale, height: origSize.height * scale)

      let fmt = UIGraphicsImageRendererFormat()
      fmt.scale = 1.0

      let resized = UIGraphicsImageRenderer(size: newSize, format: fmt).image { _ in
        image.draw(in: CGRect(origin: .zero, size: newSize))
      }

      do {
        let outputURL = try self.writeImageToTmp(resized, originalURI: uri, quality: quality / 100.0, prefix: "resized")
        resolve("file://" + outputURL.path)
      } catch {
        reject("E_RESIZE_FAILED", error.localizedDescription, error)
      }
    }
  }

  @objc public func getImageMetadata(_ uri: String,
                                     resolve: @escaping RCTPromiseResolveBlock,
                                     reject: @escaping RCTPromiseRejectBlock) {
    queue.async {
      guard let url = URL(string: uri) else {
        reject("E_INVALID_URI", "Bad URI: \(uri)", nil)
        return
      }

      guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
            let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any] else {
        reject("E_METADATA_FAILED", "Can't read properties for \(uri)", nil)
        return
      }

      let width = props[kCGImagePropertyPixelWidth] as? Int ?? 0
      let height = props[kCGImagePropertyPixelHeight] as? Int ?? 0

      var fileSize: Int64 = 0
      if url.isFileURL {
        fileSize = (try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? Int64) ?? 0
      } else if let d = try? Data(contentsOf: url) {
        fileSize = Int64(d.count)
      }

      let ext = url.pathExtension.lowercased()
      let mime: String
      switch ext {
      case "png": mime = "image/png"
      case "jpg", "jpeg": mime = "image/jpeg"
      default: mime = "image/unknown"
      }

      resolve([
        "width": width,
        "height": height,
        "fileSize": fileSize,
        "mimeType": mime,
      ] as [String: Any])
    }
  }

  @objc public func generateThumbnails(_ uris: [String],
                                       thumbSize: Double,
                                       resolve: @escaping RCTPromiseResolveBlock,
                                       reject: @escaping RCTPromiseRejectBlock) {
    isCancelled = false

    queue.async { [weak self] in
      guard let self else { return }

      var thumbUris: [String] = []
      let total = uris.count
      let size = CGFloat(thumbSize)

      let fmt = UIGraphicsImageRendererFormat()
      fmt.scale = 1.0

      for (i, uri) in uris.enumerated() {
        if self.isCancelled {
          resolve(thumbUris)
          return
        }

        guard let url = URL(string: uri),
              let data = try? Data(contentsOf: url),
              let image = UIImage(data: data) else {
          thumbUris.append("")
          continue
        }

        let squareSize = CGSize(width: size, height: size)
        let thumbnail = UIGraphicsImageRenderer(size: squareSize, format: fmt).image { _ in
          let origSize = image.size
          let minDim = min(origSize.width, origSize.height)
          let cropRect = CGRect(
            x: (origSize.width - minDim) / 2,
            y: (origSize.height - minDim) / 2,
            width: minDim,
            height: minDim
          )
          if let cropped = image.cgImage?.cropping(to: cropRect) {
            UIImage(cgImage: cropped).draw(in: CGRect(origin: .zero, size: squareSize))
          } else {
            image.draw(in: CGRect(origin: .zero, size: squareSize))
          }
        }

        do {
          let outURL = try self.writeImageToTmp(thumbnail, originalURI: uri, quality: 0.8, prefix: "thumb_\(i)")
          let thumbUri = "file://" + outURL.path
          thumbUris.append(thumbUri)

          DispatchQueue.main.async {
            self.onProgressCallback?([
              "completed": i + 1,
              "total": total,
              "lastUri": thumbUri,
            ])
          }
        } catch {
          thumbUris.append("")
        }
      }

      resolve(thumbUris)
    }
  }

  @objc public func cancelProcessing() {
    isCancelled = true
  }

  private func writeImageToTmp(_ image: UIImage, originalURI: String, quality: Double, prefix: String) throws -> URL {
    let lower = originalURI.lowercased()
    let isJpeg = lower.hasSuffix(".jpeg") || lower.hasSuffix(".jpg")

    let data: Data?
    let ext: String
    if isJpeg {
      data = image.jpegData(compressionQuality: CGFloat(quality))
      ext = "jpeg"
    } else {
      data = image.pngData()
      ext = "png"
    }

    guard let imageData = data else {
      throw NSError(domain: "ImageProcessor", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to encode image"])
    }

    let outURL = FileManager.default.temporaryDirectory
      .appendingPathComponent("\(prefix)_\(UUID().uuidString).\(ext)")
    try imageData.write(to: outURL)
    return outURL
  }
}
