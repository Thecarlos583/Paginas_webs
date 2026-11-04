# Fotos y logo de Mamamina Lodge

Para cambiar una foto: reemplace el archivo en `fotos/` con **el mismo nombre**, en WebP, y su miniatura `-600` (600 px de ancho). Luego corra `python _generadores/mamamina.py` para que se actualicen las medidas.

| Archivo | Qué foto va | Dónde sale |
|---|---|---|
| `logo.webp` | Logo negro con fondo transparente. Provisional: sale de una captura, pedir el original | Encabezado de todas las páginas |
| `logo-blanco.webp` | El mismo logo en blanco | Pie de todas las páginas |
| `portada.webp` | La mejor foto del lodge: piscina o playa, horizontal | Inicio (portada) |
| `piscina.webp` | Piscina grande, horizontal | Piscina y bar (portada), Inicio (tarjeta) |
| `bar.webp` | El bar al lado de la piscina | Piscina y bar |
| `bohio.webp` | El bohío, techo de palma junto a la piscina | Piscina y bar |
| `caney.webp` | El caney | Piscina y bar |
| `restaurante.webp` | Un plato o el comedor | Restaurante (portada), Inicio (tarjeta) |
| `habitacion-1.webp` | Habitación doble por dentro | Habitaciones, Inicio (tarjeta) |
| `habitacion-2.webp` | Habitación triple por dentro | Habitaciones |
| `habitacion-3.webp` | Habitación familiar por dentro | Habitaciones |
| `islotes.webp` | Los islotes desde la lancha | Islotes (portada), Inicio (tarjeta) |
| `playa.webp` | La playa de Puerto Píritu | Inicio (franja oscura) |
| `galeria-1.webp` | Islotes: arena | Galería, Islotes |
| `galeria-2.webp` | Islotes: agua clara | Galería, Islotes |
| `galeria-3.webp` | Islotes: lancha | Galería, Islotes |
| `galeria-4.webp` | Atardecer | Galería, Cómo llegar |
| `galeria-5.webp` | Piscina con tumbonas | Galería, Piscina y bar |
| `galeria-6.webp` | Ambiente del bar o áreas comunes | Galería |
| `galeria-7.webp` | Comida servida | Galería, Restaurante |
| `galeria-8.webp` | Islotes u otra vista | Galería, Islotes |

**Colores del logo:** cambie las 5 variables del inicio de `_generadores/mamamina_estilos.css` (`--primario`, `--secundario`, `--acento`, `--fondo`, `--texto`) y vuelva a generar.

**Al tener las fotos reales:** quitar "Fotos referenciales" del pie y la sección de créditos de la galería (en el generador).
