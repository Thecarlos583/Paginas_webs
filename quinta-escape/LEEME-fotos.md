# Fotos de Quinta Escape

Son **fotos reales del Sr. Vitor**: 38 de su carpeta (23-11-2026) y 18 de su web quintaescape.com (24-11-2026, con su permiso; se procesan con `_generadores/quinta_escape_fotos_web.py`). Todas en WebP calidad 80, máximo 1600 px, miniatura -600, sin datos de ubicación ni de cámara. Los originales no van al repo.
Para cambiar una, reemplace el archivo en `fotos/` con el mismo nombre, en WebP, y su miniatura `-600`. Si cambia la proporción, regenere (`python _generadores/quinta_escape.py`). Los textos alternativos están en el generador.

| Foto | Qué es | Dónde sale |
|---|---|---|
| `casa-general` | La casa completa con el jardín y la piscina (álbum del 24-11) | Inicio (portada, 1.a), Galería |
| `casa-churuata` | La casa y la churuata (álbum del 24-11) | Inicio (portada, 2.a) |
| `churuata-2` | Churuata al atardecer | Inicio (portada, 3.a) |
| `vitor-yadilka` | Los dueños | Inicio (Bienvenidos) |
| `galeria-22` / `noche-piscina` | Piscina al atardecer / de noche | Piscina y churuata (De la tarde a la noche) |
| `chef`, `jardin` | Chef local, jardín | La casa |
| `playa-corrales` ... `playa-el-banquito` | Una foto por playa (de su web) | Playas y zona; `playa-corrales` también en el mapa |
| `golondrinas`, `atardecer`, `luna` | Lo que se ve desde la casa | Playas y zona, Inicio (noche), Galería |
| `logo-insignia.webp`, `logo-64.png` | Insignia del logo de su web, sin fondo | Cabecera, pie e ícono de la pestaña |

Colores: las 5 variables al inicio de `estilos.css`.
Ubicación (Google Maps, ruta, Waze y mapa incrustado): solo en el generador, constantes LAT, LON y PLACE_ID.
Formularios de Registro y Solicitud de reserva: `CONFIG.formRegistro` y `CONFIG.formSolicitud` al inicio de `sitio.js` (POR CONFIRMAR; mientras tanto los botones piden el formulario por WhatsApp).
