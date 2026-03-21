import AVFoundation
import Foundation

guard CommandLine.arguments.count == 2 else {
  fputs("Usage: swift scripts/inspect_video.swift <video-path>\n", stderr)
  exit(64)
}

let url = URL(fileURLWithPath: CommandLine.arguments[1])
let asset = AVURLAsset(url: url)

guard let track = asset.tracks(withMediaType: .video).first else {
  fputs("No video track found.\n", stderr)
  exit(1)
}

let formatDescriptions = track.formatDescriptions as! [CMFormatDescription]
let codecType = formatDescriptions.first.map { CMFormatDescriptionGetMediaSubType($0) } ?? 0
let codecFourCC = UTCreateStringForOSType(codecType).takeRetainedValue() as String

let naturalSize = track.naturalSize.applying(track.preferredTransform)
let width = Int(abs(naturalSize.width.rounded()))
let height = Int(abs(naturalSize.height.rounded()))
let duration = CMTimeGetSeconds(asset.duration)

print("path=\(url.path)")
print("codec=\(codecFourCC)")
print("duration=\(duration)")
print("width=\(width)")
print("height=\(height)")
print("nominalFrameRate=\(track.nominalFrameRate)")
