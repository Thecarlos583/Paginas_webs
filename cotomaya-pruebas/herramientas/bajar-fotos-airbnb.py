"""Baja las fotos de los anuncios de Airbnb de Cotomaya y las deja listas en la web.

Uso (desde la carpeta de la web, la que tiene index.html):

    python herramientas/bajar-fotos-airbnb.py
        Baja TODAS las propiedades de datos-fuente/fotos-airbnb.json.

    python herramientas/bajar-fotos-airbnb.py casa-aurora-tucacas
        Baja solo esa propiedad (puede poner varios id separados por espacio).

    python herramientas/bajar-fotos-airbnb.py --leer-anuncio casa-aurora-tucacas https://www.airbnb.com/rooms/1777764045451326018
        Lee la página del anuncio y anota sus fotos (hasta 20) en datos-fuente/fotos-airbnb.json.
        Después corra el primer comando con ese id para bajarlas.

    python herramientas/bajar-fotos-airbnb.py --completar
        Lee el anuncio de cada propiedad de datos-fuente/fotos-airbnb.json (el enlace de Airbnb
        sale de datos/propiedades.json) y completa su lista hasta 20 fotos.

Qué hace al bajar:
  1. Descarga cada foto (pidiéndola a 1440 px) a fotos-originales/<id>/ (esa carpeta NO se sube).
  2. Llama a preparar-fotos.py, que las pasa a WebP, saca las miniaturas y escribe la lista
     "fotos" de la propiedad en datos/propiedades.json.
  3. Le pone a cada foto su texto alternativo ("Piscina", "Habitación"...), sin nombres de nadie.
  Si una foto no baja, sigue con las demás y al final dice cuáles fallaron.
"""
import json
import re
import subprocess
import sys
import time
import urllib.request
import http.cookiejar
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "datos-fuente" / "fotos-airbnb.json"
JSON_PROP = RAIZ / "datos" / "propiedades.json"
ORIGINALES = RAIZ / "fotos-originales"
PREPARAR = Path(__file__).resolve().parent / "preparar-fotos.py"
MAX_FOTOS = 20
POR_ESPACIO = 4  # máximo de fotos del mismo espacio (por ejemplo, 4 habitaciones), para que haya variedad
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
ABRIR = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

# Palabras del anuncio (en inglés) -> texto alternativo en español. El orden importa: gana la primera que aparezca.
ESPACIOS = [
    (r"hot tub|jacuzzi", "Jacuzzi"),
    (r"pool table|billiard", "Mesa de pool"),
    (r"pool", "Piscina"),
    (r"beach|shore|sea view|ocean", "Playa y mar"),
    (r"dock|pier|jetty", "Muelle"),
    (r"boat|yacht", "Paseo en lancha"),
    (r"bathroom|toilet|shower", "Baño"),
    (r"bedroom|bed\b|bunk|sleeping", "Habitación"),
    (r"kitchen", "Cocina"),
    (r"dining", "Comedor"),
    (r"living|lounge|sofa", "Sala"),
    (r"grill|bbq|barbecue|kiosk", "Parrillera"),
    (r"terrace|balcony|deck|patio", "Terraza"),
    (r"garden|backyard|yard|green", "Jardín"),
    (r"chapel", "Capilla"),
    (r"breakfast", "Desayuno"),
    (r"parking|garage", "Estacionamiento"),
    (r"exterior|facade|outside|outdoor|view", "Exterior"),
    (r"work ?space|office|desk", "Área de trabajo"),
    (r"laundry|washer", "Lavandería"),
]


def alt_de(etiqueta):
    t = (etiqueta or "").lower()
    for patron, texto in ESPACIOS:
        if re.search(patron, t):
            return texto
    return "Foto de la propiedad"


def limpiar(url):
    return url.split("?")[0].replace("%3D", "=")


def leer_json(p, defecto):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return defecto


def guardar_json(p, datos):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def url_de(x):
    return x["url"] if isinstance(x, dict) else x


def fotos_del_anuncio(enlace):
    """Lista [(url, alt)] en el orden del recorrido de fotos del anuncio."""
    m = re.search(r"/rooms/(\d+)", enlace)
    if not m:
        raise ValueError("el enlace no parece de un anuncio de Airbnb (debe tener /rooms/número)")
    pagina = f"https://www.airbnb.com/rooms/{m.group(1)}?locale=en"
    r = ABRIR.open(urllib.request.Request(pagina, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"}), timeout=40)
    h = r.read().decode("utf-8", "replace")
    pares = re.findall(r'"accessibilityLabel":"((?:[^"\\]|\\.)*)","baseUrl":"(https://a0\.muscache\.com/im/pictures/(?:hosting|miso|prohost-api)/[^"]+)"', h)
    vistos, out = set(), []
    for etiqueta, url in pares:
        url = limpiar(url)
        if url in vistos:
            continue
        vistos.add(url)
        out.append((url, alt_de(etiqueta)))
    if not out:
        raise ValueError("no encontré fotos en la página (puede que el anuncio esté oculto o que Airbnb haya cambiado su página)")
    return out


def completar(pid, enlace, fuente):
    actuales = fuente.get(pid, [])
    anuncio = fotos_del_anuncio(enlace)
    alts = dict(anuncio)
    lista = [{"url": limpiar(url_de(x)), "alt": (x.get("alt") if isinstance(x, dict) else None) or alts.get(limpiar(url_de(x)), "Foto de la propiedad")} for x in actuales]
    ya = {x["url"] for x in lista}
    cuenta = {}
    for x in lista:
        cuenta[x["alt"]] = cuenta.get(x["alt"], 0) + 1
    for url, alt in anuncio:
        if len(lista) >= MAX_FOTOS:
            break
        if url in ya or cuenta.get(alt, 0) >= POR_ESPACIO:
            continue
        lista.append({"url": url, "alt": alt})
        ya.add(url)
        cuenta[alt] = cuenta.get(alt, 0) + 1
    fuente[pid] = lista
    return len(lista)


def bajar(pid, lista):
    carpeta = ORIGINALES / pid
    if carpeta.exists():
        for f in carpeta.iterdir():
            f.unlink()
    carpeta.mkdir(parents=True, exist_ok=True)
    fallaron, alts = [], []
    for k, x in enumerate(lista, 1):
        url = limpiar(url_de(x))
        ext = Path(url).suffix.lower() if Path(url).suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") else ".jpg"
        destino = carpeta / f"{k:02d}{ext}"
        for intento in range(3):
            try:
                req = urllib.request.Request(url + "?im_w=1440", headers={"User-Agent": UA})
                datos = urllib.request.urlopen(req, timeout=60).read()
                if len(datos) < 2000:
                    raise ValueError("archivo vacío")
                destino.write_bytes(datos)
                alts.append((x.get("alt") if isinstance(x, dict) else None) or "Foto de la propiedad")
                break
            except Exception as err:
                if intento == 2:
                    fallaron.append(f"{pid} foto {k}: {url} ({err})")
                else:
                    time.sleep(2)
    if not alts:
        return fallaron
    r = subprocess.run([sys.executable, str(PREPARAR), str(carpeta), pid], capture_output=True, text=True, encoding="utf-8")
    print(r.stdout.strip().splitlines()[-2] if r.stdout.strip() else "", r.stderr.strip()[-300:])
    # Texto alternativo de cada foto, en el mismo orden
    props = leer_json(JSON_PROP, [])
    p = next((q for q in props if isinstance(q, dict) and q.get("id") == pid), None)
    if p is not None and len(p.get("fotos", [])) == len(alts):
        p["fotos"] = [{"archivo": (f if isinstance(f, str) else f.get("archivo")), "alt": a} for f, a in zip(p["fotos"], alts)]
        guardar_json(JSON_PROP, props)
    return fallaron


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    fuente = leer_json(FUENTE, {})
    if "--leer-anuncio" in sys.argv:
        if len(args) != 2:
            sys.exit("Uso: --leer-anuncio <id> <enlace de Airbnb>")
        n = completar(args[0], args[1], fuente)
        guardar_json(FUENTE, fuente)
        print(f"{args[0]}: {n} fotos anotadas en datos-fuente/fotos-airbnb.json. Ahora corra: python herramientas/bajar-fotos-airbnb.py {args[0]}")
        return
    if "--completar" in sys.argv:
        props = {p.get("id"): p for p in leer_json(JSON_PROP, []) if isinstance(p, dict)}
        for pid in list(fuente):
            enlace = ((props.get(pid) or {}).get("enlaces") or {}).get("airbnb")
            if not enlace:
                print(f"{pid}: sin enlace de Airbnb en propiedades.json, se deja como está")
                continue
            try:
                print(f"{pid}: {completar(pid, enlace, fuente)} fotos")
            except Exception as err:
                print(f"{pid}: no se pudo leer el anuncio ({err}), se deja como está")
            time.sleep(1.5)
        guardar_json(FUENTE, fuente)
        return
    ids = args or list(fuente)
    fallaron = []
    for pid in ids:
        if pid not in fuente:
            print(f"{pid}: no está en datos-fuente/fotos-airbnb.json")
            continue
        print(f"\n{pid}: bajando {len(fuente[pid])} fotos…")
        fallaron += bajar(pid, fuente[pid])
    if fallaron:
        print("\nEstas fotos NO bajaron (las demás sí):")
        for f in fallaron:
            print("  -", f)
    else:
        print("\nTodas las fotos bajaron bien.")


if __name__ == "__main__":
    main()
