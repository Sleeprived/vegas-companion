"""Dev-only icon generator for Vegas Companion.

Writes the PWA PNG icons using only the Python standard library (no Pillow).
Re-run from the project root to regenerate:

    python tools/make-icons.py

Produces icons/icon-192.png, icons/icon-512.png, icons/apple-touch-icon-180.png.
The design is a single die: a full-bleed dark background (safe as a maskable
icon), a gold rounded-square die face, and five dark pips (a quincunx). Not used
at runtime; the app ships the generated PNGs.
"""

import os
import struct
import zlib

BG = (11, 14, 26)        # deep night, full bleed (matches --bg)
GOLD = (245, 197, 66)    # die face (matches --accent)
GOLD_DK = (200, 160, 40) # subtle face edge
PIP = (11, 14, 26)       # pips = background colour, punched out of the face


def _chunk(tag, data):
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def _in_rounded_square(dx, dy, half, radius):
    """True if (dx,dy) from centre is inside a rounded square of half-size `half`
    and corner `radius`."""
    if abs(dx) > half or abs(dy) > half:
        return False
    inner = half - radius
    if abs(dx) <= inner or abs(dy) <= inner:
        return True
    cx = abs(dx) - inner
    cy = abs(dy) - inner
    return cx * cx + cy * cy <= radius * radius


def write_png(path, size):
    cx = cy = (size - 1) / 2.0
    half = 0.32 * size          # die half-width
    radius = 0.085 * size       # rounded corners
    edge = 0.30 * size          # inner face (for a thin darker rim)
    pip_off = 0.185 * size      # quincunx offset
    pip_r = 0.052 * size
    pips = [(-pip_off, -pip_off), (pip_off, -pip_off), (0, 0), (-pip_off, pip_off), (pip_off, pip_off)]

    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type 0 (none)
        for x in range(size):
            dx, dy = x - cx, y - cy
            r, g, b = BG
            if _in_rounded_square(dx, dy, half, radius):
                r, g, b = GOLD_DK
                if _in_rounded_square(dx, dy, edge, radius * 0.8):
                    r, g, b = GOLD
                for px, py in pips:
                    if (dx - px) ** 2 + (dy - py) ** 2 <= pip_r * pip_r:
                        r, g, b = PIP
            raw += bytes((r, g, b, 255))

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    png = sig + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", idat) + _chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print("wrote", path, size, "x", size)


def main():
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(here, "icons")
    os.makedirs(out, exist_ok=True)
    write_png(os.path.join(out, "icon-192.png"), 192)
    write_png(os.path.join(out, "icon-512.png"), 512)
    write_png(os.path.join(out, "apple-touch-icon-180.png"), 180)


if __name__ == "__main__":
    main()
