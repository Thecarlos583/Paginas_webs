"""Prepara las fotos de UNA propiedad de Cotomaya y las anota solas en datos/propiedades.json.

Uso (desde la carpeta de la web, la que tiene index.html):
    python herramientas/preparar-fotos.py "C:/ruta/a/las/fotos originales" villa-la-vizcaya
    python herramientas/preparar-fotos.py "C:/ruta/fotos nuevas" villa-la-vizcaya --agregar

Qué hace:
  1. Toma las fotos JPG, PNG, WEBP o HEIC de la carpeta, en orden por nombre
     (renómbrelas 01, 02, 03... antes si quiere un orden exacto; la primera es la portada).
  2. Las endereza (según el celular), las reduce a 1600 px como máximo y las guarda en WebP calidad 80.
  3. Crea la miniatura de 600 px de cada una (01-600.webp).
  4. Las numera 01.webp, 02.webp... en fotos/propiedades/<id>/.
  5. Escribe la lista "fotos" de esa propiedad en datos/propiedades.json.

Sin --agregar, reemplaza las fotos que tuviera la propiedad. Con --agregar, las pone al final.
Para fotos HEIC (iPhone) hace falta una vez:  pip install pillow-heif
"""
import json
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
JSON_PROP = RAIZ / "datos" / "propiedades.json"
MAX_LADO, MINI, CALIDAD = 1600, 600, 80
LIMITE_MB = 500
EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}


def orden_natural(p):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", p.name)]


def tamano_mb(carpeta):
    return sum(f.stat().st_size for f in carpeta.rglob("*") if f.is_file()) / 1024 / 1024


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    agregar = "--agregar" in sys.argv
    if len(args) != 2:
        print(__doc__)
        sys.exit(1)
    origen, pid = Path(args[0]), args[1].strip()
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", pid):
        sys.exit(f'El id "{pid}" no sirve: use minúsculas, números y guiones, sin espacios ni acentos (ejemplo: villa-la-vizcaya).')
    if not origen.is_dir():
        sys.exit(f"No encuentro la carpeta: {origen}")

    fotos = sorted([f for f in origen.iterdir() if f.suffix.lower() in EXT], key=orden_natural)
    if not fotos:
        sys.exit("No hay fotos JPG, PNG, WEBP ni HEIC en esa carpeta.")
    if any(f.suffix.lower() in (".heic", ".heif") for f in fotos):
        try:
            from pillow_heif import register_heif_opener
            register_heif_opener()
        except ImportError:
            sys.exit("Hay fotos HEIC (de iPhone). Instale una vez el lector con:  pip install pillow-heif  y vuelva a correr esto.")

    destino = RAIZ / "fotos" / "propiedades" / pid
    destino.mkdir(parents=True, exist_ok=True)
    existentes = sorted(destino.glob("[0-9][0-9].webp"))
    if not agregar:
        for f in destino.glob("[0-9][0-9]*.webp"):
            f.unlink()
        inicio = 1
    else:
        inicio = len(existentes) + 1

    nuevas = []
    for k, f in enumerate(fotos):
        n = f"{inicio + k:02d}"
        try:
            im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
        except Exception as err:
            print(f"  saltada {f.name}: no se pudo abrir ({err})")
            continue
        grande = im.copy()
        grande.thumbnail((MAX_LADO, MAX_LADO), Image.LANCZOS)
        grande.save(destino / f"{n}.webp", "WEBP", quality=CALIDAD, method=6)
        chica = im.copy()
        chica.thumbnail((MINI, MINI * 4), Image.LANCZOS)  # 600 px de ancho
        chica.save(destino / f"{n}-600.webp", "WEBP", quality=CALIDAD - 5, method=6)
        nuevas.append(f"{pid}/{n}.webp")
        print(f"  {f.name} -> fotos/propiedades/{pid}/{n}.webp ({grande.width}x{grande.height})")

    # Anotar en propiedades.json
    try:
        datos = json.loads(JSON_PROP.read_text(encoding="utf-8"))
    except Exception as err:
        sys.exit(f"Las fotos quedaron listas, pero no pude leer datos/propiedades.json ({err}). Revise comas y llaves, y anote a mano:\n" + json.dumps(nuevas, ensure_ascii=False, indent=2))
    prop = next((p for p in datos if isinstance(p, dict) and p.get("id") == pid), None)
    if prop is None:
        print(f'\nOJO: en propiedades.json no hay ninguna propiedad con "id": "{pid}".')
        print("Copie el bloque de otra propiedad, cámbiele el id por este y pegue esta lista en \"fotos\":")
        print(json.dumps(nuevas, ensure_ascii=False, indent=2))
    else:
        previas = [x for x in prop.get("fotos", []) if isinstance(x, str) and x.startswith(pid + "/")] if agregar else []
        prop["fotos"] = previas + nuevas
        JSON_PROP.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f'\nListo: "{prop.get("nombre", pid)}" tiene ahora {len(prop["fotos"])} fotos en propiedades.json.')

    mb = tamano_mb(RAIZ)
    print(f"La web pesa ahora {mb:.0f} MB.")
    if mb > LIMITE_MB:
        print(f"AVISO: pasó de {LIMITE_MB} MB. Avísele a Carlos ANTES de publicar (los videos podrían ir a YouTube como no listados).")


if __name__ == "__main__":
    main()
