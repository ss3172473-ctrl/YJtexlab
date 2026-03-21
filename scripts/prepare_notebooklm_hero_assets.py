#!/usr/bin/env python3

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/hero/notebooklm-infographic.png"
OUTPUT_DIR = ROOT / "public/hero/generated"
OUTPUT_SIZE = (1920, 1080)


@dataclass(frozen=True)
class Variant:
    name: str
    crop: tuple[float, float, float, float]
    mirror: bool = False
    contrast: float = 1.0
    color: float = 1.0
    sharpness: float = 1.0
    brightness: float = 1.0


VARIANTS = [
    Variant("fabric-01", (0.0, 0.0, 1.0, 1.0), contrast=1.04, color=1.0, sharpness=1.2),
    Variant("fabric-02", (0.02, 0.0, 0.98, 0.98), contrast=1.02, color=0.98, sharpness=1.16),
    Variant("fabric-03", (0.0, 0.02, 0.96, 1.0), contrast=1.05, color=1.03, sharpness=1.22),
    Variant("fabric-04", (0.04, 0.0, 1.0, 0.98), mirror=True, contrast=1.04, color=1.01, sharpness=1.18),
    Variant("fabric-05", (0.0, 0.04, 1.0, 0.96), contrast=1.01, color=0.95, sharpness=1.12, brightness=1.01),
    Variant("fabric-06", (0.03, 0.03, 0.97, 0.97), contrast=1.06, color=1.05, sharpness=1.24),
    Variant("fabric-07", (0.01, 0.0, 0.99, 0.99), mirror=True, contrast=1.03, color=0.99, sharpness=1.18),
    Variant("fabric-08", (0.0, 0.01, 0.97, 0.99), contrast=1.05, color=1.02, sharpness=1.2, brightness=0.99),
]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as source:
        base = source.convert("RGB")

    cleaned = remove_watermark(base)

    for variant in VARIANTS:
        image = create_variant(cleaned, variant)
        output_path = OUTPUT_DIR / f"{variant.name}.webp"
        image.save(output_path, format="WEBP", quality=94, method=6)
        print(f"Saved {output_path.relative_to(ROOT)}")


def remove_watermark(image: Image.Image) -> Image.Image:
    width, height = image.size
    cropped_width = 2624
    cropped_height = 1476
    left = 0
    top = 0
    right = left + cropped_width
    bottom = top + cropped_height
    cropped = image.crop((left, top, right, bottom))
    return ImageOps.fit(cropped, OUTPUT_SIZE, method=Image.Resampling.LANCZOS)


def create_variant(image: Image.Image, variant: Variant) -> Image.Image:
    width, height = image.size
    left = int(width * variant.crop[0])
    top = int(height * variant.crop[1])
    right = int(width * variant.crop[2])
    bottom = int(height * variant.crop[3])

    framed = image.crop((left, top, right, bottom))
    framed = ImageOps.fit(framed, OUTPUT_SIZE, method=Image.Resampling.LANCZOS)

    if variant.mirror:
        framed = ImageOps.mirror(framed)

    framed = ImageEnhance.Contrast(framed).enhance(variant.contrast)
    framed = ImageEnhance.Color(framed).enhance(variant.color)
    framed = ImageEnhance.Brightness(framed).enhance(variant.brightness)
    framed = ImageEnhance.Sharpness(framed).enhance(variant.sharpness)

    # Keep the thread detail crisp without looking overprocessed.
    framed = framed.filter(ImageFilter.UnsharpMask(radius=1.1, percent=110, threshold=3))
    return framed


if __name__ == "__main__":
    main()
