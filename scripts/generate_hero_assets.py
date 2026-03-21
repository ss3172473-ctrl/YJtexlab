#!/usr/bin/env python3

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()


@dataclass(frozen=True)
class HeroAsset:
    source: str
    output: str
    size: tuple[int, int]
    contrast: float = 1.04
    saturation: float = 0.97
    sharpness: float = 1.12


ASSETS = [
    HeroAsset(
        source="원단/44인치/스프트라이프/IMG_7962_아이보리-스카이블루_스트라이프.HEIC",
        output="public/hero/fabric-panel-01.webp",
        size=(1920, 1080),
        contrast=1.08,
        saturation=0.98,
        sharpness=1.45,
    ),
    HeroAsset(
        source="원단/44인치/스프트라이프/IMG_7970_차콜-블루_스트라이프.HEIC",
        output="public/hero/fabric-panel-02.webp",
        size=(1920, 1080),
        contrast=1.1,
        saturation=0.94,
        sharpness=1.48,
    ),
    HeroAsset(
        source="원단/44인치/체크/IMG_7961_오프화이트-스카이블루_체크.HEIC",
        output="public/hero/fabric-panel-03.webp",
        size=(1920, 1080),
        contrast=1.07,
        saturation=0.97,
        sharpness=1.42,
    ),
    HeroAsset(
        source="원단/44인치/체크/IMG_8014_그레이-블루_체크.HEIC",
        output="public/hero/fabric-panel-04.webp",
        size=(1920, 1080),
        contrast=1.08,
        saturation=0.96,
        sharpness=1.42,
    ),
    HeroAsset(
        source="원단/44인치/기타/IMG_7984_그레이-아이보리_도비.HEIC",
        output="public/hero/fabric-panel-05.webp",
        size=(1920, 1080),
        contrast=1.05,
        saturation=0.9,
        sharpness=1.5,
    ),
    HeroAsset(
        source="원단/58인치/옥스포드/IMG_8038_블루_옥스포드.HEIC",
        output="public/hero/fabric-panel-06.webp",
        size=(1920, 1080),
        contrast=1.04,
        saturation=0.96,
        sharpness=1.38,
    ),
    HeroAsset(
        source="원단/58인치/옥스포드/IMG_8053_아이보리-그레이_옥스포드.HEIC",
        output="public/hero/fabric-panel-07.webp",
        size=(1920, 1080),
        contrast=1.05,
        saturation=0.9,
        sharpness=1.38,
    ),
    HeroAsset(
        source="원단/44인치/체크/IMG_8005_베이지-올리브_체크.HEIC",
        output="public/hero/fabric-panel-08.webp",
        size=(1920, 1080),
        contrast=1.06,
        saturation=0.96,
        sharpness=1.44,
    ),
]


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    for asset in ASSETS:
        source_path = root / asset.source
        output_path = root / asset.output
        output_path.parent.mkdir(parents=True, exist_ok=True)
        export_asset(source_path, output_path, asset)
        print(f"Saved {output_path.relative_to(root)}")


def export_asset(source_path: Path, output_path: Path, asset: HeroAsset) -> None:
    with Image.open(source_path) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")

    image = ImageOps.fit(
        image,
        asset.size,
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )
    image = ImageEnhance.Contrast(image).enhance(asset.contrast)
    image = ImageEnhance.Color(image).enhance(asset.saturation)
    image = ImageEnhance.Sharpness(image).enhance(asset.sharpness)

    image.save(output_path, format="WEBP", quality=93, method=6)


if __name__ == "__main__":
    main()
