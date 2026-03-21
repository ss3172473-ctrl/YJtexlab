#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import unicodedata
from collections import Counter
from colorsys import rgb_to_hls
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

PATTERN_MAP = {
    "체크": "체크",
    "스트라이프": "스트라이프",
    "스프트라이프": "스트라이프",
    "옥스포드": "옥스포드",
    "기타": "도비",
}

NEUTRAL_COLORS = {
    "화이트",
    "오프화이트",
    "아이보리",
    "베이지",
    "그레이",
    "차콜",
    "블랙",
}


@dataclass
class ProcessedImage:
    relative_path: str
    target_name: str
    pattern_name: str
    color_names: list[str]
    bucket_summary: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--rename-only", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parents[1]
    fabric_root = root / "원단"
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    report_path = fabric_root / f"_fabric_processing_report_{timestamp}.tsv"

    files = sorted(
        file_path
        for file_path in fabric_root.rglob("*.HEIC")
        if "_backup_original_heic_" not in file_path.as_posix()
    )

    if args.limit:
        files = files[: args.limit]

    if not files:
        print("처리할 HEIC 파일이 없습니다.")
        return

    results: list[ProcessedImage] = []
    pattern_counter: Counter[str] = Counter()
    color_counter: Counter[str] = Counter()

    for file_path in files:
        result = process_file(
            file_path=file_path,
            fabric_root=fabric_root,
            apply_changes=args.apply,
            rename_only=args.rename_only,
        )
        results.append(result)
        pattern_counter[result.pattern_name] += 1
        color_counter.update(result.color_names)
        mode = "APPLY" if args.apply else "DRY"
        print(f"{mode} {result.relative_path} -> {result.target_name}")

    write_report(report_path, results)

    print("\n요약")
    print(f"- 총 파일: {len(results)}")
    print(f"- 패턴: {format_counter(pattern_counter)}")
    print(f"- 색상: {format_counter(color_counter)}")
    print(f"리포트: {report_path}")


def process_file(
    file_path: Path,
    fabric_root: Path,
    apply_changes: bool,
    rename_only: bool,
) -> ProcessedImage:
    relative_path = file_path.relative_to(fabric_root)
    pattern_name = detect_pattern(file_path.parent.name)
    source_base = file_path.stem

    with Image.open(file_path) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        color_names, bucket_summary = extract_color_summary(image)

    target_base = f"{source_base}_{'-'.join(color_names)}_{pattern_name}"
    target_path = unique_target_path(file_path.parent, target_base, file_path.suffix)

    if apply_changes:
        if rename_only:
            file_path.rename(target_path)
        else:
            raise RuntimeError("현재 스크립트는 rename-only 모드만 지원합니다.")

    return ProcessedImage(
        relative_path=str(relative_path),
        target_name=target_path.name,
        pattern_name=pattern_name,
        color_names=color_names,
        bucket_summary=bucket_summary,
    )


def detect_pattern(raw_pattern_name: str) -> str:
    normalized = unicodedata.normalize("NFC", raw_pattern_name)
    return PATTERN_MAP.get(normalized, normalized)


def extract_color_summary(image: Image.Image) -> tuple[list[str], str]:
    preview = image.copy()
    preview.thumbnail((96, 96), Image.Resampling.LANCZOS)
    pixels = list(preview.getdata())
    total = len(pixels)
    buckets = Counter(classify_color(*pixel) for pixel in pixels)
    ordered = sorted(
        (
            {
                "name": name,
                "count": count,
                "ratio": count / total,
            }
            for name, count in buckets.items()
        ),
        key=lambda item: item["count"],
        reverse=True,
    )
    color_names = summarize_color_names(ordered)
    bucket_summary = ",".join(
        f'{bucket["name"]}:{bucket["ratio"]:.3f}' for bucket in ordered[:5]
    )
    return color_names, bucket_summary


def summarize_color_names(buckets: list[dict[str, float]]) -> list[str]:
    if not buckets:
        return ["기본색"]

    primary = buckets[0]["name"]
    chromatic_accent = next(
        (
            bucket["name"]
            for bucket in buckets[1:]
            if bucket["ratio"] >= 0.04
            and bucket["name"] != primary
            and bucket["name"] not in NEUTRAL_COLORS
        ),
        None,
    )
    neutral_accent = next(
        (
            bucket["name"]
            for bucket in buckets[1:]
            if bucket["ratio"] >= 0.08
            and bucket["name"] != primary
            and bucket["name"] in NEUTRAL_COLORS
        ),
        None,
    )

    if primary in NEUTRAL_COLORS:
        if chromatic_accent:
            return [primary, chromatic_accent]
        if neutral_accent:
            return [primary, neutral_accent]

    if primary not in NEUTRAL_COLORS and neutral_accent:
        return [neutral_accent, primary]

    return [primary]


def classify_color(r: int, g: int, b: int) -> str:
    h, l, s = rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    hue = h * 360.0

    if l >= 0.95 and s <= 0.08:
        return "화이트"

    if s <= 0.08:
        if l >= 0.82:
            return "오프화이트"
        if l >= 0.68:
            return "아이보리"
        if l >= 0.42:
            return "그레이"
        if l >= 0.18:
            return "차콜"
        return "블랙"

    if 15 <= hue < 55 and l >= 0.68:
        return "베이지"

    if hue >= 330 or hue < 12:
        return "버건디" if l < 0.48 else "레드"

    if 12 <= hue < 42:
        return "브라운" if l < 0.52 else "오렌지"

    if 42 <= hue < 65:
        return "베이지" if s < 0.32 else "옐로"

    if 65 <= hue < 95:
        return "올리브"

    if 95 <= hue < 165:
        return "그린"

    if 165 <= hue < 205:
        return "스카이블루"

    if 205 <= hue < 245:
        return "네이비" if l < 0.42 else "블루"

    if 245 <= hue < 290:
        return "블루"

    if 290 <= hue < 330:
        return "퍼플" if l < 0.46 else "핑크"

    return "브라운"


def unique_target_path(directory: Path, target_base: str, suffix: str) -> Path:
    candidate = directory / f"{target_base}{suffix}"
    index = 2
    while candidate.exists():
        candidate = directory / f"{target_base}_{index}{suffix}"
        index += 1
    return candidate


def write_report(report_path: Path, results: list[ProcessedImage]) -> None:
    with report_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t")
        writer.writerow(["original_relative", "target_file", "pattern", "colors", "buckets"])
        for result in results:
            writer.writerow(
                [
                    result.relative_path,
                    result.target_name,
                    result.pattern_name,
                    ",".join(result.color_names),
                    result.bucket_summary,
                ]
            )


def format_counter(counter: Counter[str]) -> str:
    return ", ".join(f"{name} {count}" for name, count in counter.most_common())


if __name__ == "__main__":
    main()
