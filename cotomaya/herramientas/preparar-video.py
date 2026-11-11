"""Comprime un video de una propiedad de Cotomaya, le saca la portada y lo anota en datos/propiedades.json.

Uso (desde la carpeta de la web, la que tiene index.html):
    python herramientas/preparar-video.py "C:/ruta/video original.mp4" villa-la-vizcaya

Qué hace:
  - Lo pasa a MP4 H.264, máximo 720 px de ancho, unos 800 kbps, audio AAC 64 kbps,
    con "faststart" (empieza a reproducir antes de bajar completo).
  - Saca una portada WebP del segundo 1.
  - Lo guarda como fotos/propiedades/<id>/video-N.mp4 (+ video-N.webp) y lo agrega a "videos".
  - Máximo 5 videos por propiedad.

Necesita FFmpeg (gratis). Si no lo tiene:  winget install Gyan.FFmpeg  (y cierre y abra la terminal).
También puede indicar dónde está con:  --ffmpeg "C:/ruta/ffmpeg.exe"
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
JSON_PROP = RAIZ / "datos" / "propiedades.json"
LIMITE_MB = 500


def buscar_ffmpeg():
    if "--ffmpeg" in sys.argv:
        i = sys.argv.index("--ffmpeg")
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return os.environ.get("FFMPEG") or shutil.which("ffmpeg")


def main():
    args, salta = [], False
    for a in sys.argv[1:]:
        if salta:
            salta = False
            continue
        if a == "--ffmpeg":
            salta = True
            continue
        if not a.startswith("--"):
            args.append(a)
    if len(args) != 2:
        print(__doc__)
        sys.exit(1)
    origen, pid = Path(args[0]), args[1].strip()
    if not origen.is_file():
        sys.exit(f"No encuentro el video: {origen}")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", pid):
        sys.exit(f'El id "{pid}" no sirve: minúsculas, números y guiones (ejemplo: villa-la-vizcaya).')
    ff = buscar_ffmpeg()
    if not ff:
        sys.exit("No encuentro FFmpeg. Instálelo una vez con:  winget install Gyan.FFmpeg  y cierre y abra la terminal.")

    try:
        datos = json.loads(JSON_PROP.read_text(encoding="utf-8"))
    except Exception as err:
        sys.exit(f"No pude leer datos/propiedades.json ({err}). Revise comas y llaves antes de seguir.")
    prop = next((p for p in datos if isinstance(p, dict) and p.get("id") == pid), None)
    if prop is not None and len(prop.get("videos", [])) >= 5:
        sys.exit(f'"{prop.get("nombre", pid)}" ya tiene 5 videos, que es el máximo. Quite uno de "videos" en propiedades.json si quiere cambiarlo.')

    carpeta = RAIZ / "fotos" / "propiedades" / pid
    carpeta.mkdir(parents=True, exist_ok=True)
    n = 1
    while (carpeta / f"video-{n}.mp4").exists():
        n += 1
    mp4, webp = carpeta / f"video-{n}.mp4", carpeta / f"video-{n}.webp"

    print("Comprimiendo (puede tardar unos minutos)...")
    r = subprocess.run([ff, "-y", "-hide_banner", "-loglevel", "error", "-i", str(origen),
                        "-vf", "scale='min(720,iw)':-2", "-c:v", "libx264", "-preset", "slow", "-b:v", "800k",
                        "-maxrate", "1000k", "-bufsize", "1600k", "-pix_fmt", "yuv420p",
                        "-c:a", "aac", "-b:a", "64k", "-ac", "2", "-movflags", "+faststart", str(mp4)])
    if r.returncode != 0 or not mp4.exists():
        sys.exit("FFmpeg no pudo comprimir el video. Revise que el archivo abra bien en su computadora.")

    with tempfile.TemporaryDirectory() as tmp:
        png = Path(tmp) / "portada.png"
        subprocess.run([ff, "-y", "-hide_banner", "-loglevel", "error", "-ss", "1", "-i", str(mp4), "-frames:v", "1", str(png)])
        if not png.exists():  # videos de menos de un segundo
            subprocess.run([ff, "-y", "-hide_banner", "-loglevel", "error", "-i", str(mp4), "-frames:v", "1", str(png)])
        if png.exists():
            Image.open(png).convert("RGB").save(webp, "WEBP", quality=78, method=6)

    entrada = {"archivo": f"{pid}/{mp4.name}", "portada": f"{pid}/{webp.name}" if webp.exists() else ""}
    mb_video = mp4.stat().st_size / 1024 / 1024
    print(f"Listo: fotos/propiedades/{pid}/{mp4.name} ({mb_video:.1f} MB)")
    if prop is None:
        print(f'\nOJO: no hay ninguna propiedad con "id": "{pid}" en propiedades.json. Agregue esto en su "videos":')
        print(json.dumps(entrada, ensure_ascii=False, indent=2))
    else:
        prop.setdefault("videos", []).append(entrada)
        JSON_PROP.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f'"{prop.get("nombre", pid)}" tiene ahora {len(prop["videos"])} video(s).')

    mb = sum(f.stat().st_size for f in RAIZ.rglob("*") if f.is_file()) / 1024 / 1024
    print(f"La web pesa ahora {mb:.0f} MB.")
    if mb > LIMITE_MB:
        print(f"AVISO: pasó de {LIMITE_MB} MB. Avísele a Carlos ANTES de publicar (los videos podrían ir a YouTube como no listados).")


if __name__ == "__main__":
    main()
