# Fotos y videos de Quinta Escape

Son **fotos y videos reales del Sr. Vitor**: 38 de su carpeta (23-11-2026), 18 de su web quintaescape.com (24-11-2026) y 27 fotos y 4 videos de su álbum grande (25-11-2026, prompt 46c). Él autorizó usarlos.
Fotos en WebP, máximo 1600 px, miniatura -600, sin datos de ubicación ni de cámara. Los originales no van al repo.
Para cambiar una, reemplace el archivo en `fotos/` con el mismo nombre, en WebP, y su miniatura `-600`. Si cambia la proporción, regenere (`python _generadores/quinta_escape.py`).

| Foto o video | Qué es | Dónde sale |
|---|---|---|
| `galeria-12` / `portada-tel` | La piscina, la churuata y el mar desde el comedor techado (completa en computadora; recorte propio en el teléfono) | Inicio (portada), Galería |
| `videos/mar`, `videos/mar-tel` | Playa Corrales con luna, en bucle y sin audio (430 y 150 KB) | Fondo del texto de la portada |
| `videos/piscina-mar`, `churuata-noche`, `olas` (+ `-tel`) | La piscina con el mar, la churuata de noche, las olas | Inicio (Lo que le espera), Piscina y churuata, Playas, Galería |
| `noche-*` | La piscina y la churuata de noche | Piscina y churuata, Tarifas (cabecera), Galería |
| `mar-*`, `amanecer-casa`, `bahia-tarde` | El mar desde la casa | La casa, Inicio, Galería |
| `playa-*` | La playa | Playas y zona, Inicio, Galería |
| `habitacion-4`, `habitacion-5`, `fachada` | Habitaciones y fachada | La casa, Galería (la fachada siempre al final) |
| `vitor-yadilka` | Los dueños | Inicio (Bienvenidos) |
| `logo-insignia.webp`, `logo-64.png` | Insignia del logo, sin la media luna blanca | Cabecera, pie e ícono de la pestaña |

Colores: las 5 variables al inicio de `estilos.css`.
Ubicación (Google Maps, ruta, Waze y mapa incrustado): solo en el generador, constantes LAT, LON y PLACE_ID.
Formulario de Solicitud de reserva: `CONFIG.formSolicitud` al inicio de `sitio.js` (POR CONFIRMAR; mientras tanto el botón la pide por WhatsApp).
