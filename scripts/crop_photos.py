#!/usr/bin/env python3
"""Crop property photos from Camella computation sheets."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

# ---------------------------------------------------------------------------
# Crop region (coordinates for a ~830px-wide portrait sheet).
# Adjust these after a test run if the crop is too tight or includes extra text.
# ---------------------------------------------------------------------------
REFERENCE_SHEET_WIDTH = 830
CROP_LEFT = 460
CROP_TOP = 80
CROP_RIGHT = 830
CROP_BOTTOM = 300

# Subfolder name fragments to skip (case-insensitive).
SKIP_DIR_KEYWORDS = ("maps", "requirements")

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg"}
JPEG_QUALITY = 95


def should_skip_path(path: Path, input_root: Path) -> bool:
    """Return True when a file lives under an ignored folder such as Maps and Requirements."""
    try:
        relative_parts = path.relative_to(input_root).parts[:-1]
    except ValueError:
        relative_parts = path.parent.parts

    for part in relative_parts:
        lowered = part.lower()
        if any(keyword in lowered for keyword in SKIP_DIR_KEYWORDS):
            return True
    return False


def scaled_crop_box(image_size: tuple[int, int]) -> tuple[int, int, int, int]:
    """Scale crop coordinates to the actual sheet width."""
    width, height = image_size
    scale = width / REFERENCE_SHEET_WIDTH

    left = int(CROP_LEFT * scale)
    top = int(CROP_TOP * scale)
    right = min(int(CROP_RIGHT * scale), width)
    bottom = min(int(CROP_BOTTOM * scale), height)

    if right <= left or bottom <= top:
        raise ValueError(
            f"Invalid crop box ({left}, {top}, {right}, {bottom}) for image size {image_size}"
        )

    return left, top, right, bottom


def output_path_for(input_file: Path, output_dir: Path) -> Path:
    stem = input_file.stem
    return output_dir / f"{stem}_photo.jpg"


def iter_image_files(input_dir: Path, recursive: bool) -> list[Path]:
    pattern = "**/*" if recursive else "*"
    files: list[Path] = []

    for path in sorted(input_dir.glob(pattern)):
        if not path.is_file():
            continue
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        if should_skip_path(path, input_dir):
            continue
        files.append(path)

    return files


def crop_and_save(input_file: Path, output_file: Path) -> None:
    with Image.open(input_file) as image:
        crop_box = scaled_crop_box(image.size)
        cropped = image.crop(crop_box)

        if cropped.mode in ("RGBA", "LA", "P"):
            cropped = cropped.convert("RGB")
        elif cropped.mode != "RGB":
            cropped = cropped.convert("RGB")

        output_file.parent.mkdir(parents=True, exist_ok=True)
        cropped.save(output_file, format="JPEG", quality=JPEG_QUALITY)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crop property photos from Camella computation sheets."
    )
    parser.add_argument(
        "--input",
        required=True,
        type=Path,
        help="Folder containing computation sheet images",
    )
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Folder where cropped photos will be saved",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="Process images in subfolders (skips Maps/Requirements folders)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_dir = args.input.resolve()
    output_dir = args.output.resolve()

    if not input_dir.is_dir():
        print(f"Error: input folder does not exist: {input_dir}", file=sys.stderr)
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)

    image_files = iter_image_files(input_dir, recursive=args.recursive)
    if not image_files:
        print(f"No supported images found in {input_dir}")
        return 0

    processed = 0
    skipped = 0

    for input_file in image_files:
        output_file = output_path_for(input_file, output_dir)
        try:
            crop_and_save(input_file, output_file)
            print(f"{input_file.name} -> {output_file}")
            processed += 1
        except Exception as exc:  # noqa: BLE001 - keep batch running on bad files
            print(f"Warning: skipped {input_file.name}: {exc}", file=sys.stderr)
            skipped += 1

    print(f"\nProcessed {processed} file(s).")
    if skipped:
        print(f"Skipped {skipped} file(s) due to errors.", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
