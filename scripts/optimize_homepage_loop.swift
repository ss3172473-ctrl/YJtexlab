import AppKit
import AVFoundation
import CoreMedia
import Foundation

enum OptimizeVideoError: Error {
  case usage
  case missingVideoTrack
  case exportSessionUnavailable
  case unsupportedOutputType
  case unsupportedPreset(String)
  case exportFailed(String)
  case posterEncodingFailed
}

func fileSize(at url: URL) -> Int64 {
  let values = try? url.resourceValues(forKeys: [.fileSizeKey])
  return Int64(values?.fileSize ?? 0)
}

do {
  guard (4...6).contains(CommandLine.arguments.count) else {
    throw OptimizeVideoError.usage
  }

  let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
  let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
  let posterURL = URL(fileURLWithPath: CommandLine.arguments[3])
  let presetKey = CommandLine.arguments.count == 5 ? CommandLine.arguments[4] : "desktop"
  let durationOverride = CommandLine.arguments.count == 6 ? Double(CommandLine.arguments[5]) : nil

  let presetName: String
  let targetWidth: CGFloat
  let targetHeightOverride: CGFloat?
  let shouldCenterCrop: Bool
  switch presetKey {
  case "desktop":
    presetName = AVAssetExportPreset1920x1080
    targetWidth = 1920
    targetHeightOverride = nil
    shouldCenterCrop = false
  case "desktop16x9":
    presetName = AVAssetExportPreset1920x1080
    targetWidth = 1920
    targetHeightOverride = 1080
    shouldCenterCrop = true
  case "mobile":
    presetName = AVAssetExportPreset640x480
    targetWidth = 480
    targetHeightOverride = nil
    shouldCenterCrop = false
  default:
    throw OptimizeVideoError.unsupportedPreset(presetKey)
  }

  let sourceAsset = AVURLAsset(url: inputURL)
  guard let sourceTrack = sourceAsset.tracks(withMediaType: .video).first else {
    throw OptimizeVideoError.missingVideoTrack
  }
  let sourceDuration = sourceAsset.duration
  let trimmedDurationSeconds = min(
    durationOverride ?? CMTimeGetSeconds(sourceDuration),
    CMTimeGetSeconds(sourceDuration)
  )
  let trimmedDuration = CMTime(seconds: trimmedDurationSeconds, preferredTimescale: 600)
  let preferredTransform = sourceTrack.preferredTransform
  let orientedBounds = CGRect(origin: .zero, size: sourceTrack.naturalSize).applying(preferredTransform)
  let orientedSize = CGSize(width: abs(orientedBounds.width), height: abs(orientedBounds.height))
  let targetHeight = targetHeightOverride ?? max(1, round(targetWidth * orientedSize.height / orientedSize.width))
  let scale = shouldCenterCrop
    ? max(targetWidth / orientedSize.width, targetHeight / orientedSize.height)
    : targetWidth / orientedSize.width

  let composition = AVMutableComposition()
  guard let compositionTrack = composition.addMutableTrack(
    withMediaType: .video,
    preferredTrackID: kCMPersistentTrackID_Invalid
  ) else {
    throw OptimizeVideoError.missingVideoTrack
  }

  try compositionTrack.insertTimeRange(
    CMTimeRange(start: .zero, duration: trimmedDuration),
    of: sourceTrack,
    at: .zero
  )
  compositionTrack.preferredTransform = preferredTransform

  let scaledTransform = preferredTransform.concatenating(CGAffineTransform(scaleX: scale, y: scale))
  let scaledBounds = CGRect(origin: .zero, size: sourceTrack.naturalSize).applying(scaledTransform)
  let normalizedTransform = scaledTransform.concatenating(
    CGAffineTransform(translationX: -scaledBounds.minX, y: -scaledBounds.minY)
  )
  let xOffset = shouldCenterCrop ? (targetWidth - scaledBounds.width) / 2 : 0
  let yOffset = shouldCenterCrop ? (targetHeight - scaledBounds.height) / 2 : 0
  let centeredTransform = normalizedTransform.concatenating(
    CGAffineTransform(translationX: xOffset, y: yOffset)
  )

  let instruction = AVMutableVideoCompositionInstruction()
  instruction.timeRange = CMTimeRange(start: .zero, duration: trimmedDuration)

  let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: compositionTrack)
  layerInstruction.setTransform(centeredTransform, at: .zero)
  instruction.layerInstructions = [layerInstruction]

  let videoComposition = AVMutableVideoComposition()
  videoComposition.instructions = [instruction]
  videoComposition.frameDuration = CMTime(value: 1, timescale: 30)
  videoComposition.renderSize = CGSize(width: targetWidth, height: targetHeight)

  let fileManager = FileManager.default
  if fileManager.fileExists(atPath: outputURL.path) {
    try fileManager.removeItem(at: outputURL)
  }
  if fileManager.fileExists(atPath: posterURL.path) {
    try fileManager.removeItem(at: posterURL)
  }

  guard let exportSession = AVAssetExportSession(
    asset: composition,
    presetName: presetName
  ) else {
    throw OptimizeVideoError.exportSessionUnavailable
  }

  guard exportSession.supportedFileTypes.contains(.mp4) else {
    throw OptimizeVideoError.unsupportedOutputType
  }

  exportSession.outputURL = outputURL
  exportSession.outputFileType = .mp4
  exportSession.shouldOptimizeForNetworkUse = true
  exportSession.videoComposition = videoComposition

  let semaphore = DispatchSemaphore(value: 0)
  exportSession.exportAsynchronously {
    semaphore.signal()
  }
  semaphore.wait()

  switch exportSession.status {
  case .completed:
    break
  case .failed:
    throw OptimizeVideoError.exportFailed(exportSession.error?.localizedDescription ?? "Unknown export failure")
  case .cancelled:
    throw OptimizeVideoError.exportFailed("Export was cancelled")
  default:
    throw OptimizeVideoError.exportFailed("Export ended with status \(exportSession.status.rawValue)")
  }

  let imageGenerator = AVAssetImageGenerator(asset: composition)
  imageGenerator.appliesPreferredTrackTransform = true
  imageGenerator.maximumSize = CGSize(width: 1280, height: 720)

  let durationSeconds = trimmedDurationSeconds
  let captureTime = CMTime(seconds: min(max(durationSeconds * 0.1, 0.1), 1.0), preferredTimescale: 600)
  let image = try imageGenerator.copyCGImage(at: captureTime, actualTime: nil)
  let representation = NSBitmapImageRep(cgImage: image)
  guard let jpegData = representation.representation(
    using: .jpeg,
    properties: [.compressionFactor: 0.82]
  ) else {
    throw OptimizeVideoError.posterEncodingFailed
  }
  try jpegData.write(to: posterURL, options: .atomic)

  let sourceSize = fileSize(at: inputURL)
  let outputSize = fileSize(at: outputURL)
  let savings = sourceSize > 0 ? 100 - (Double(outputSize) / Double(sourceSize) * 100) : 0

  print("Created \(outputURL.path)")
  print("Poster \(posterURL.path)")
  print("Trimmed duration: \(trimmedDurationSeconds) seconds")
  print("Source size: \(sourceSize) bytes")
  print("Output size: \(outputSize) bytes")
  print(String(format: "Savings: %.1f%%", savings))
} catch OptimizeVideoError.usage {
  fputs("Usage: swift scripts/optimize_homepage_loop.swift <input.mov> <output.mp4> <poster.jpg> [desktop|desktop16x9|mobile] [durationSeconds]\n", stderr)
  exit(64)
} catch OptimizeVideoError.unsupportedPreset(let preset) {
  fputs("Unsupported preset: \(preset). Use desktop, desktop16x9, or mobile.\n", stderr)
  exit(64)
} catch {
  fputs("Video optimization failed: \(error.localizedDescription)\n", stderr)
  exit(1)
}
