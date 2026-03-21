#!/usr/bin/env python3

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def feather_mask(width: int, height: int, feather: int) -> np.ndarray:
    if feather <= 0:
        return np.ones((height, width), dtype=np.float32)

    x = np.minimum(np.arange(width), np.arange(width)[::-1]).astype(np.float32)
    y = np.minimum(np.arange(height), np.arange(height)[::-1]).astype(np.float32)
    fx = np.clip(x / feather, 0.0, 1.0)
    fy = np.clip(y / feather, 0.0, 1.0)
    return np.outer(fy, fx)


def apply_patch(image: np.ndarray, patch_spec: dict) -> np.ndarray:
    x = patch_spec["x"]
    y = patch_spec["y"]
    w = patch_spec["w"]
    h = patch_spec["h"]
    dx = patch_spec["dx"]
    dy = patch_spec["dy"]
    feather = patch_spec.get("feather", 40)
    gain = patch_spec.get("gain", 1.0)
    bias = patch_spec.get("bias", [0.0, 0.0, 0.0])

    src_x = x + dx
    src_y = y + dy

    mode = patch_spec.get("mode", "clone")
    target = image[y:y + h, x:x + w].astype(np.float32)
    source = image[src_y:src_y + h, src_x:src_x + w].astype(np.float32)

    if target.shape != source.shape or target.size == 0:
        raise ValueError(f"Invalid patch spec: {patch_spec}")

    if mode == "tone":
        radius = patch_spec.get("blur_radius", 80)
        target_img = Image.fromarray(target.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=radius))
        source_img = Image.fromarray(source.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=radius))
        target_blur = np.array(target_img).astype(np.float32)
        source_blur = np.array(source_img).astype(np.float32)
        ratio = source_blur / np.maximum(target_blur, 1.0)
        source = target * ratio
    elif mode == "match":
        target_mean = target.mean(axis=(0, 1), keepdims=True)
        target_std = target.std(axis=(0, 1), keepdims=True)
        source_mean = source.mean(axis=(0, 1), keepdims=True)
        source_std = source.std(axis=(0, 1), keepdims=True)
        source = (target - target_mean) * (source_std / np.maximum(target_std, 1.0)) + source_mean
    else:
        source = source * float(gain) + np.array(bias, dtype=np.float32)

    source = np.clip(source, 0.0, 255.0)

    mask = feather_mask(w, h, feather)[..., None]
    blended = target * (1.0 - mask) + source * mask

    out = image.copy()
    out[y:y + h, x:x + w] = blended.astype(np.uint8)
    return out


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    manifest_path = root / ".omx" / "fabric_pilot" / "manifest.json"
    output_dir = root / ".omx" / "fabric_pilot" / "outputs"
    compare_dir = root / ".omx" / "fabric_pilot" / "comparisons"
    output_dir.mkdir(parents=True, exist_ok=True)
    compare_dir.mkdir(parents=True, exist_ok=True)

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    report_rows = []

    for item in manifest["images"]:
        preview = Path(item["preview"])
        image = np.array(Image.open(preview).convert("RGB"))
        edited = image.copy()

        for patch_spec in item.get("patches", []):
            edited = apply_patch(edited, patch_spec)

        out_name = f'{item["id"]}_retouched.png'
        out_path = output_dir / out_name
        Image.fromarray(edited).save(out_path)

        before = Image.fromarray(image)
        after = Image.fromarray(edited)
        w, h = before.size
        compare = Image.new("RGB", (w * 2, h), (255, 255, 255))
        compare.paste(before, (0, 0))
        compare.paste(after, (w, 0))
        compare.save(compare_dir / f'{item["id"]}_compare.png')

        report_rows.append(
            {
                "id": item["id"],
                "source": item["source"],
                "class": item["class"],
                "control": item.get("control", False),
                "patch_count": len(item.get("patches", [])),
                "output": str(out_path),
            }
        )

    report_path = root / ".omx" / "fabric_pilot" / "run-report.json"
    report_path.write_text(
        json.dumps({"images": report_rows}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(report_path)


if __name__ == "__main__":
    main()
