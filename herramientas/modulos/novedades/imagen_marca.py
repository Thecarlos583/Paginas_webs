"""Imagen por defecto para compartir artículos sin foto: 1200 x 630, degradado de la marca y logo claro al centro.

Uso:
    python imagen_marca.py <logo-claro.png> <salida.jpg> "#0B7F8C,#3A64B8,#7A3FD0"
"""
import math
import sys

from PIL import Image


def hex_rgb(h):
    h = h.strip().lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def degradado(w, h, colores, angulo=115):
    cols = [hex_rgb(c) for c in colores]
    a = math.radians(angulo)
    dx, dy = math.sin(a), -math.cos(a)  # dirección del degradado al estilo CSS
    largo = abs(w * dx) + abs(h * dy)
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = ((x - w / 2) * dx + (y - h / 2) * dy) / largo + 0.5
            t = min(1, max(0, t)) * (len(cols) - 1)
            i = min(int(t), len(cols) - 2)
            f = t - i
            c0, c1 = cols[i], cols[i + 1]
            px[x, y] = tuple(round(c0[k] + (c1[k] - c0[k]) * f) for k in range(3))
    return img


def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    logo, salida, colores = sys.argv[1], sys.argv[2], sys.argv[3].split(",")
    fondo = degradado(1200, 630, colores)
    l = Image.open(logo).convert("RGBA")
    ancho = 560
    l = l.resize((ancho, round(l.height * ancho / l.width)), Image.LANCZOS)
    fondo.paste(l, ((1200 - l.width) // 2, (630 - l.height) // 2), l)
    fondo.save(salida, "JPEG", quality=86, optimize=True, progressive=True)
    print(salida)


if __name__ == "__main__":
    main()
