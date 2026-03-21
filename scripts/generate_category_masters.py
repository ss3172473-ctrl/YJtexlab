#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_SIZE = (1920, 1080)
HERO_DIR = ROOT / "public" / "hero"
OUTPUT_DIR = ROOT / "public" / "categories" / "fabrics"


def fit_image(image: Image.Image, *, crop_box: tuple[float, float, float, float] | None = None) -> Image.Image:
    width, height = image.size
    framed = image
    if crop_box is not None:
        left = int(width * crop_box[0])
        top = int(height * crop_box[1])
        right = int(width * crop_box[2])
        bottom = int(height * crop_box[3])
        framed = image.crop((left, top, right, bottom))
    return ImageOps.fit(framed, OUTPUT_SIZE, method=Image.Resampling.LANCZOS)


def polish(image: Image.Image, *, contrast: float, color: float, sharpness: float, brightness: float = 1.0) -> Image.Image:
    image = ImageEnhance.Contrast(image).enhance(contrast)
    image = ImageEnhance.Color(image).enhance(color)
    image = ImageEnhance.Brightness(image).enhance(brightness)
    image = ImageEnhance.Sharpness(image).enhance(sharpness)
    return image.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120, threshold=3))


def save_variant(name: str, image: Image.Image) -> None:
    category_dir = OUTPUT_DIR / name
    category_dir.mkdir(parents=True, exist_ok=True)
    output_path = category_dir / "master.webp"
    image.save(output_path, format="WEBP", quality=95, method=6)
    print(f"Saved {output_path.relative_to(ROOT)}")


def build_stripes() -> Image.Image:
    with Image.open(HERO_DIR / "fabric-stripe-charcoal-blue.webp") as source:
        base = fit_image(source.convert("RGB"), crop_box=(0.06, 0.05, 0.94, 0.95))
    return polish(base, contrast=1.06, color=0.95, sharpness=1.26)


def build_checks() -> Image.Image:
    with Image.open(HERO_DIR / "fabric-check-beige-olive.webp") as source:
        base = fit_image(source.convert("RGB"), crop_box=(0.04, 0.02, 0.96, 0.94))
    return polish(base, contrast=1.05, color=1.02, sharpness=1.22)


def build_others() -> Image.Image:
    with Image.open(HERO_DIR / "fabric-dobby-grey-ivory.webp") as dobby_source:
        dobby = fit_image(dobby_source.convert("RGB"), crop_box=(0.02, 0.03, 0.98, 0.92))
    with Image.open(HERO_DIR / "fabric-oxford-blue.webp") as oxford_source:
        oxford = fit_image(oxford_source.convert("RGB"), crop_box=(0.06, 0.08, 0.94, 0.9))

    blended = Image.blend(oxford, dobby, 0.24)
    return polish(blended, contrast=1.03, color=0.94, sharpness=1.2, brightness=1.01)


def main() -> None:
    save_variant("stripes", build_stripes())
    save_variant("checks", build_checks())
    save_variant("others", build_others())


if __name__ == "__main__":
    main()
