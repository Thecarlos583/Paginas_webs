# ESTADO de Paginas_webs
Actualizado: 13-nov-2026. Contexto del negocio: `%USERPROFILE%\agencia-carlos\AGENTS.md` y `contexto\clientes.md`.

## Qué es
El repo **público** con las webs de clientes, las vistas previas para prospectos y las páginas modelo de la agencia. Cada carpeta es una web estática independiente. Es público a propósito: GitHub Pages gratis solo publica repos públicos. Por eso aquí **nunca** van claves, pagos ni datos privados de clientes.

## Cómo está hecho y cómo se publica
- HTML, CSS y JS sin build. Se construyen siempre con la skill **webs-carlos**: español venezolano, primero el celular y WhatsApp como llamado a la acción.
- Publicación: `git push` a `main` y GitHub Pages la sirve en `https://thecarlos583.github.io/Paginas_webs/<carpeta>/`.
- `vista-previa/<nombre>-<código>/`: vistas previas con dirección difícil de adivinar para mandar a prospectos.
- `vista-previa/rancho-luis-pmfp/` es solo una redirección a chaletrancholuis.com. **No borrarla**: esa dirección se mandó por WhatsApp.
- Cotomaya funciona con datos en JSON (`cotomaya/datos/`); su guía está en `cotomaya/LEEME-cotomaya.md`. Las fotos se bajan de Airbnb con un script, y la regla es no poner nunca el nombre real de la propiedad ni el de los anfitriones.

## Carpetas y estado
| Carpeta | Qué es | Estado |
|---|---|---|
| cotomaya | Cliente. Catálogo de propiedades A/B/C, Venezuela y Colombia | Fases 1 a 5 hechas el 13-nov con datos reales de 17 propiedades. Falta la revisión de la clienta |
| golondrinas | Cliente (Sanare) | Publicada; fotos reales nuevas el 11-nov. Faltan fotos y videos sin editar |
| quinta-escape | Cliente | Publicada el 7-nov con fotos viejas; ahora hay churuata. Piloto de Cupo |
| hoku-hamaquita / hoku-turismo | Cliente Hoku | Publicadas el 9-nov (hamaquita entregada) |
| villa-campestre | Cliente Villa Gisela | Publicada |
| anubel, villaserena, mi-refugio, villa-santa-marta, agua-viva, tierra-latina, mamamina-lodge, perlacoral, posada-d-luigi, cabanas-el-bosque | Vistas previas para prospectos | Publicadas entre octubre y noviembre |
| casa-solar, el-andanes, espiritu-santo, flor-de-merida, la-solariega, los-aches | Demostraciones de posadas de Mérida (1-oct) | Publicadas |
| modelo-* (hotel, restaurante, spa, dental, tienda, fisioterapia, comida-casera) | Páginas modelo por rubro | Publicadas |
| vista-previa/* | Vistas previas viejas (El Manantial, Fisiosalud, Doña Casilda, Las Ross, etc.) | Publicadas |

## Pendientes, en orden de prioridad
1. Cotomaya: que la clienta la revise, y ajustar. Pagos y acuerdos con cada cliente: solo en `agencia-carlos\contexto\clientes.md` (este repo es público).
2. Golondrinas: cargar las fotos y videos que faltan cuando lleguen. Su video promocional no se sube a redes.
3. Quinta Escape: fotos nuevas con la churuata y el botón de Cupo cuando Cupo salga.
4. Prospectos calientes (Mamamina, D' Luigi, PerlaCoral): ajustar según lo que respondan.
5. La muestra de Posada Las Ross que estaba sin commit en la carpeta vieja quedó en el repo privado `archivo-claude-code/paginas-sin-publicar/las-ross` (sin fotos). No se subió aquí para no publicarla.

## Decisiones importantes
- Cada web debe ser distinta a la anterior, con referencias reales. La vara a superar es chaletrancholuis.com.
- Sin animaciones que van apareciendo al bajar.
- El chalet tiene repo y dominio propios (`chaletrancholuis`).
- Los prompts de cada web están en `agencia-carlos\claude\prompt-*.md`.
