#!/usr/bin/env python3
"""Draw a simple lemon PNG for the PWA icon."""
import struct
import zlib
from pathlib import Path


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: Path, size: int) -> None:
    raw = bytearray()
    cx = cy = size / 2
    radius = size * 0.36
    for y in range(size):
        raw.append(0)
        for x in range(size):
            dx = x - cx
            dy = (y - cy) / 1.15
            inside = dx * dx + dy * dy <= radius * radius
            leaf = (x - cx) ** 2 / (radius * 0.35) ** 2 + (y - (cy - radius * 0.85)) ** 2 / (radius * 0.22) ** 2 <= 1
            if leaf:
                raw.extend((47, 140, 70, 255))
            elif inside:
                raw.extend((255, 214, 60, 255))
            else:
                raw.extend((255, 248, 220, 255))
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


root = Path(__file__).resolve().parents[1] / "public"
for size in (192, 512):
    write_png(root / f"icon-{size}.png", size)
print("icons written")
