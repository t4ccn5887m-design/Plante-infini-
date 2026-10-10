#!/usr/bin/env python3
"""Détourage rembg + fond blanc — stdin/stdout ou fichiers. Usage: python rembg-white.py input.png output.png"""

import io
import sys

from PIL import Image
from rembg import remove


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: rembg-white.py <input> <output.png>", file=sys.stderr)
        sys.exit(2)

    input_path, output_path = sys.argv[1], sys.argv[2]
    with open(input_path, "rb") as f:
        raw = f.read()

    cut = remove(raw)
    img = Image.open(io.BytesIO(cut)).convert("RGBA")
    white = Image.new("RGB", img.size, (255, 255, 255))
    white.paste(img, mask=img.split()[3])
    white.save(output_path, "PNG")


if __name__ == "__main__":
    main()
