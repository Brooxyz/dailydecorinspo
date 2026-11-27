"""Zero-token image optimizer for Daily Decor Inspo room heroes and product packshots."""

from __future__ import annotations

import argparse
import io
from pathlib import Path

from PIL import Image, ImageOps

STOREFRONT_ROOT = Path(__file__).resolve().parent.parent
ROOMS_DIR = STOREFRONT_ROOT / "public" / "images" / "rooms"
PRODUCTS_DIR = STOREFRONT_ROOT / "public" / "images" / "products"

ROOM_TARGET_SIZE = (1000, 1500)
ROOM_MAX_BYTES = 280 * 1024
PRODUCT_MAX_DIM = 800
PRODUCT_MAX_BYTES = 180 * 1024


def to_rgb_white_bg(img: Image.Image) -> Image.Image:
    """Convert any Pillow image mode to RGB, compositing alpha over pure white."""
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        bg = Image.new("RGB", rgba.size, (255, 255, 255))
        bg.paste(rgba, mask=rgba.split()[3])
        return bg
    if img.mode != "RGB":
        return img.convert("RGB")
    return img


def encode_jpeg(img: Image.Image, quality: int) -> bytes:
    """Encode an RGB Pillow image into an optimized progressive JPEG byte buffer."""
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True, progressive=True)
    return buf.getvalue()


def optimize_room_image(path: Path, dry_run: bool) -> tuple[bool, int, int, str]:
    """Normalize room hero images above 1000x1500 or 280 KB."""
    orig_bytes = path.stat().st_size
    with Image.open(path) as raw:
        w, h = raw.size
        needs_resize = w > ROOM_TARGET_SIZE[0] or h > ROOM_TARGET_SIZE[1]
        needs_compress = orig_bytes > ROOM_MAX_BYTES
        if not needs_resize and not needs_compress:
            return False, orig_bytes, orig_bytes, "ok"

        rgb = to_rgb_white_bg(raw)
        if w != ROOM_TARGET_SIZE[0] or h != ROOM_TARGET_SIZE[1]:
            rgb = ImageOps.fit(
                rgb, ROOM_TARGET_SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5)
            )
        new_data = encode_jpeg(rgb, quality=86)
        new_bytes = len(new_data)
        if not needs_resize and new_bytes >= orig_bytes * 0.95:
            return False, orig_bytes, orig_bytes, "already-optimal"

        if not dry_run:
            path.write_bytes(new_data)
        return True, orig_bytes, new_bytes, f"{w}x{h}->{rgb.size[0]}x{rgb.size[1]}"


def optimize_product_image(path: Path, dry_run: bool) -> tuple[bool, int, int, str]:
    """Shrink oversized product packshots preserving aspect ratio (never crops)."""
    orig_bytes = path.stat().st_size
    with Image.open(path) as raw:
        w, h = raw.size
        needs_resize = w > PRODUCT_MAX_DIM or h > PRODUCT_MAX_DIM
        needs_compress = orig_bytes > PRODUCT_MAX_BYTES
        if not needs_resize and not needs_compress:
            return False, orig_bytes, orig_bytes, "ok"

        rgb = to_rgb_white_bg(raw)
        if needs_resize:
            rgb.thumbnail((PRODUCT_MAX_DIM, PRODUCT_MAX_DIM), Image.Resampling.LANCZOS)
        new_data = encode_jpeg(rgb, quality=88)
        new_bytes = len(new_data)
        if not needs_resize and new_bytes >= orig_bytes * 0.95:
            return False, orig_bytes, orig_bytes, "already-optimal"

        if not dry_run:
            path.write_bytes(new_data)
        return True, orig_bytes, new_bytes, f"{w}x{h}->{rgb.size[0]}x{rgb.size[1]}"


def main() -> int:
    """Optimize room hero and product images and report compact KB savings."""
    parser = argparse.ArgumentParser(description="Optimize storefront room & product images.")
    parser.add_argument("--dry-run", action="store_true", help="Inspect savings without writing files.")
    args = parser.parse_args()

    room_files = sorted(ROOMS_DIR.glob("room-*.jpg")) if ROOMS_DIR.exists() else []
    product_files = sorted(PRODUCTS_DIR.glob("room-*/*.jpg")) if PRODUCTS_DIR.exists() else []

    changed_count = 0
    total_before = 0
    total_after = 0

    for path in room_files:
        changed, before, after, note = optimize_room_image(path, args.dry_run)
        total_before += before
        total_after += after
        if changed:
            changed_count += 1
            print(f"  [room]    {path.name}: {before // 1024}KB -> {after // 1024}KB ({note})")

    for path in product_files:
        changed, before, after, note = optimize_product_image(path, args.dry_run)
        total_before += before
        total_after += after
        if changed:
            changed_count += 1
            rel = path.relative_to(PRODUCTS_DIR)
            print(f"  [product] {rel.as_posix()}: {before // 1024}KB -> {after // 1024}KB ({note})")

    saved_kb = (total_before - total_after) / 1024.0
    mode = "DRY-RUN" if args.dry_run else "DONE"
    total_scanned = len(room_files) + len(product_files)
    print(
        f"[optimize_images:{mode}] scanned={total_scanned}, optimized={changed_count}, "
        f"before={total_before / 1024.0:.1f}KB, after={total_after / 1024.0:.1f}KB, saved={saved_kb:.1f}KB"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
