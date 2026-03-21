#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOTS = [ROOT / "원단", ROOT / "원단 2"]
OUTPUT_ROOT = ROOT / "public" / "categories" / "fabrics"
OUTPUT_SIZE = (1920, 1080)
VARIANTS_PER_CATEGORY = 6

CATEGORY_MAP = {
    "스트라이프": "stripes",
    "스프트라이프": "stripes",
    "체크": "checks",
    "옥스포드": "others",
    "기타": "others",
}

CATEGORY_TUNING = {
    "stripes": {"contrast": 1.06, "color": 0.98, "brightness": 1.01, "sharpness": 1.2},
    "checks": {"contrast": 1.04, "color": 1.0, "brightness": 1.0, "sharpness": 1.16},
    "others": {"contrast": 1.03, "color": 0.95, "brightness": 1.01, "sharpness": 1.12},
}

SAFE_CROP_BY_CATEGORY = {
    "stripes": (0.08, 0.2, 0.92, 0.82),
    "checks": (0.1, 0.19, 0.9, 0.82),
    "others": (0.1, 0.18, 0.9, 0.84),
}


@dataclass(frozen=True)
class SourceImage:
    category: str
    width_family: str
    color_key: str
    path: Path



def normalize_name(value: str) -> str:
    return unicodedata.normalize("NFC", value)



def detect_category(path: Path) -> str | None:
    for parent in path.parents:
        mapped = CATEGORY_MAP.get(normalize_name(parent.name))
        if mapped:
            return mapped
    return None



def extract_width_family(path: Path) -> str:
    for part in path.parts:
        normalized = normalize_name(part)
        if "44" in normalized:
            return "44"
        if "58" in normalized:
            return "58"
    return "unknown"



def extract_color_key(path: Path) -> str:
    stem = normalize_name(path.stem)
    tokens = [token for token in re.split(r"[_-]", stem) if token and not token.startswith("IMG")]
    return "-".join(tokens[:2]) or stem



def collect_sources() -> dict[str, list[SourceImage]]:
    grouped: dict[str, list[SourceImage]] = {"stripes": [], "checks": [], "others": []}

    for source_root in SOURCE_ROOTS:
        if not source_root.exists():
            continue

        for path in sorted(source_root.rglob("*.HEIC")):
            if "_backup_original_heic_" in path.as_posix():
                continue

            category = detect_category(path)
            if category is None:
                continue

            grouped[category].append(
                SourceImage(
                    category=category,
                    width_family=extract_width_family(path),
                    color_key=extract_color_key(path),
                    path=path,
                )
            )

    return grouped



def rank_sources(images: list[SourceImage]) -> list[SourceImage]:
    return sorted(
        images,
        key=lambda item: (
            0 if item.width_family == "58" else 1,
            len(item.color_key),
            item.color_key,
            item.path.name,
        ),
    )



def curate_category(images: list[SourceImage], limit: int) -> list[SourceImage]:
    ranked = rank_sources(images)
    if len(ranked) <= limit:
        return ranked

    by_width: dict[str, list[SourceImage]] = {"58": [], "44": [], "unknown": []}
    for image in ranked:
        by_width.setdefault(image.width_family, []).append(image)

    selected: list[SourceImage] = []
    used_colors: set[str] = set()

    for width_family in ("58", "44", "unknown"):
        candidates = by_width.get(width_family, [])
        for candidate in candidates:
            if len(selected) >= limit:
                break
            if candidate.color_key in used_colors:
                continue
            selected.append(candidate)
            used_colors.add(candidate.color_key)
            if len(selected) >= max(2, limit // 2) and width_family == "58":
                break

    if len(selected) < limit:
        for candidate in ranked:
            if len(selected) >= limit:
                break
            if candidate in selected:
                continue
            selected.append(candidate)

    return selected[:limit]



def crop_to_landscape(image: Image.Image, category: str, index: int, count: int) -> Image.Image:
    width, height = image.size
    safe_left, safe_top, safe_right, safe_bottom = SAFE_CROP_BY_CATEGORY[category]

    crop_width = width * (safe_right - safe_left)
    crop_height = crop_width * OUTPUT_SIZE[1] / OUTPUT_SIZE[0]

    max_top = height - crop_height
    center_ratio = 0.5 if count <= 1 else index / (count - 1)
    top_ratio = safe_top + (safe_bottom - safe_top) * (0.18 + center_ratio * 0.64)
    top = min(max(height * top_ratio - crop_height / 2, 0), max_top)
    left = min(max(width * safe_left, 0), width - crop_width)
    right = left + crop_width
    bottom = top + crop_height

    cropped = image.crop((int(left), int(top), int(right), int(bottom)))
    return ImageOps.fit(cropped, OUTPUT_SIZE, method=Image.Resampling.LANCZOS)



def polish(image: Image.Image, category: str) -> Image.Image:
    tuning = CATEGORY_TUNING[category]
    polished = ImageEnhance.Contrast(image).enhance(tuning["contrast"])
    polished = ImageEnhance.Color(polished).enhance(tuning["color"])
    polished = ImageEnhance.Brightness(polished).enhance(tuning["brightness"])
    polished = ImageEnhance.Sharpness(polished).enhance(tuning["sharpness"])
    return polished.filter(ImageFilter.UnsharpMask(radius=1.2, percent=115, threshold=3))



def build_variant(source: SourceImage, index: int, count: int) -> Image.Image:
    with Image.open(source.path) as raw:
        image = ImageOps.exif_transpose(raw).convert("RGB")
    cropped = crop_to_landscape(image, source.category, index, count)
    return polish(cropped, source.category)



def write_category(category: str, sources: list[SourceImage]) -> dict[str, object]:
    category_dir = OUTPUT_ROOT / category
    category_dir.mkdir(parents=True, exist_ok=True)

    variants = []
    count = len(sources)

    for index, source in enumerate(sources, start=1):
        image = build_variant(source, index - 1, count)
        filename = f"plane-{index:02d}.webp"
        output_path = category_dir / filename
        image.save(output_path, format="WEBP", quality=92, method=6)
        variants.append(
            {
                "slot": index,
                "file": f"/categories/fabrics/{category}/{filename}",
                "source": str(source.path.relative_to(ROOT)),
                "width_family": source.width_family,
                "color_key": source.color_key,
            }
        )

    if variants:
        master_target = category_dir / "master.webp"
        with Image.open(category_dir / "plane-01.webp") as first_image:
            first_image.save(master_target, format="WEBP", quality=93, method=6)

    return {
        "category": category,
        "count": len(variants),
        "master": f"/categories/fabrics/{category}/master.webp",
        "planes": variants,
    }



def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    grouped_sources = collect_sources()
    manifest: dict[str, object] = {"categories": []}

    for category in ("stripes", "checks", "others"):
        curated = curate_category(grouped_sources[category], VARIANTS_PER_CATEGORY)
        if not curated:
            continue
        manifest["categories"].append(write_category(category, curated))

    manifest_path = OUTPUT_ROOT / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(manifest_path.relative_to(ROOT))


if __name__ == "__main__":
    main()
