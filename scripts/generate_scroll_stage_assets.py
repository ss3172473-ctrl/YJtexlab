#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import shutil
import unicodedata
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "원단"
OUTPUT_ROOT = ROOT / "public" / "stage-fabrics"
OUTPUT_SIZE = (1200, 900)
LIMITS = {
    "stripes": 20,
    "checks": 20,
    "others": 18,
}
GROUPS = {
    "stripes": {"스트라이프", "스프트라이프"},
    "checks": {"체크"},
    "others": {"기타", "옥스포드"},
}


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii").lower()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")
    return slug or "fabric"


def evenly_sample(paths: list[Path], limit: int) -> list[Path]:
    if len(paths) <= limit:
        return paths

    sampled = []
    for index in range(limit):
        position = round(index * (len(paths) - 1) / max(limit - 1, 1))
        sampled.append(paths[position])

    unique: list[Path] = []
    seen: set[Path] = set()
    for path in sampled:
        if path in seen:
            continue
        unique.append(path)
        seen.add(path)
    return unique


def discover_sources() -> dict[str, list[Path]]:
    grouped: dict[str, list[Path]] = {category: [] for category in GROUPS}
    seen_stems: set[str] = set()

    for source_path in sorted(SOURCE_ROOT.rglob("*.HEIC")):
        bucket_name = source_path.parent.name
        for category, names in GROUPS.items():
            if bucket_name not in names:
                continue
            if source_path.stem in seen_stems:
                break
            grouped[category].append(source_path)
            seen_stems.add(source_path.stem)
            break

    selected: dict[str, list[Path]] = {}
    for category, paths in grouped.items():
        selected[category] = evenly_sample(paths, LIMITS[category])
    return selected


def polish(image: Image.Image, category: str) -> Image.Image:
    contrast = 1.04
    color = 1.0
    sharpness = 1.18
    brightness = 1.0
    if category == "stripes":
        contrast = 1.06
        sharpness = 1.24
    elif category == "checks":
        contrast = 1.05
        color = 1.02
        sharpness = 1.22
    elif category == "others":
        color = 0.96
        brightness = 1.01

    image = ImageEnhance.Contrast(image).enhance(contrast)
    image = ImageEnhance.Color(image).enhance(color)
    image = ImageEnhance.Brightness(image).enhance(brightness)
    image = ImageEnhance.Sharpness(image).enhance(sharpness)
    return image.filter(ImageFilter.UnsharpMask(radius=1.1, percent=110, threshold=3))


def build_image(source_path: Path, category: str) -> Image.Image:
    with Image.open(source_path) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        fitted = ImageOps.fit(image, OUTPUT_SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        return polish(fitted, category)


def main() -> None:
    if OUTPUT_ROOT.exists():
        for child in OUTPUT_ROOT.iterdir():
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()

    selected = discover_sources()
    manifest: dict[str, list[dict[str, str]]] = {}
    for category, source_paths in selected.items():
        category_dir = OUTPUT_ROOT / category
        category_dir.mkdir(parents=True, exist_ok=True)
        items = []
        for index, source_path in enumerate(source_paths, start=1):
            target_name = f"{index:02d}-{slugify(source_path.stem)}.webp"
            output_path = category_dir / target_name
            image = build_image(source_path, category)
            image.save(output_path, format="WEBP", quality=94, method=6)
            items.append(
                {
                    "src": f"/stage-fabrics/{category}/{target_name}",
                    "name": source_path.stem,
                    "category": category,
                }
            )
            print(f"saved {output_path.relative_to(ROOT)}")
        manifest[category] = items

    manifest_path = OUTPUT_ROOT / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved {manifest_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
