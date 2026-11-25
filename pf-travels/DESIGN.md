# PF Travels · DESIGN.md

Vista previa de prospección (Aeropuerto Internacional Josefa Camejo, Punto Fijo, Paraguaná). Generada con `contexto-claude-code/herramientas/agencias-pf/agencia.py pf-travels` (copia propia del generador de agencias del prompt 48; el de YouTravel no se toca). Los datos viven en `datos/*.json`; el diseño, en `herramientas/agencias-pf/base/` y `temas/pf-travels.css`.

## Idea
**El viento sobre el médano.** Paraguaná se reconoce por dos cosas: la arena que el viento peina en los Médanos de Coro y el mar a ambos lados de la península. La página pasa del médano al mar: fondos de arena, secciones de azul mar profundo, y como motivo las **líneas onduladas que deja el viento en la arena**, finas, generadas en Python (cada una distinta, misma familia), para divisores, fondos y la portada.

Prueba del competidor: una agencia de Puerto Ordaz o de Caracas no tiene médanos ni el aeropuerto de Las Piedras. La idea solo sirve aquí.

## Referencias (qué tomo de cada una)
- **Aman** (aman.com): serif de alto contraste, mucho aire y fotos de paisaje sin adornos; tono sobrio.
- **Original Travel** (originaltravel.co.uk): buscar viajes por presupuesto y por mes, no solo por destino. De aquí sale la novedad del deslizador de presupuesto.
- **Jacada Travel** (jacadatravel.com): fichas con itinerario día por día y precio "desde" visible arriba.
- **Godly / Land-book, sitios de desierto y costa**: fondos color arena con un solo color cálido para la acción y fotos a sangre con bordes orgánicos.

## Últimas 5 (no parecerse)
YouTravel (Funnel, blanco + degradado turquesa a violeta, aro), Casa Club Villa 52 (Federo, piscina art déco), 0295 VIP (Gloock, azul noche, carta de navegación), Oasis (Caprasimo, arena y turquesa, curvas de nivel), Mansión La Faraona (Brygada, verde y dorado). Esta: **serif DM Serif Display con cursiva**, **arena de médano + azul mar profundo + coral del atardecer**, **esquinas casi rectas** (YouTravel era todo redondo) y **líneas de viento** en vez de aros o curvas de nivel. Oasis también usaba arena: aquí la arena es más dorada, el acento es azul mar (no turquesa) y el motivo son ondas paralelas de viento, no curvas cerradas.

## Tipografía
- Títulos: **DM Serif Display** 400 y cursiva (una palabra por título va en cursiva, como "el viento" en la portada). Interlineado 1, tracking -0,01em.
- Texto: **Libre Franklin** 400/500/600/700.
- Tamaños: 13 / 16 / 19 / clamp(30-52) / clamp(40-92).

## Colores (contraste medido)
| Uso | Color | Contraste |
|---|---|---|
| Fondo arena de médano | #F1E4CC | |
| Arena clara (tarjetas, campos) | #F8F1E4 | |
| Arena honda (fondo alterno) | #E8D6B6 | |
| Azul mar profundo (títulos, texto, secciones de acento; nunca negro) | #0B3954 | 9,7:1 sobre #F1E4CC |
| Texto suave | #3B5568 | 6,2:1 sobre #F1E4CC; 5,5:1 sobre #E8D6B6 |
| Sección azul con texto arena | #0B3954 / #F8F1E4 | 10,8:1 |
| Coral del atardecer: solo botón principal | #C4472D con texto blanco | 4,9:1 |
| Coral claro: solo trazos y cursivas sobre azul | #F08A6C | 5,0:1 sobre #0B3954 |
| Verde cardón: muy puntual (etiqueta "Cerca", marcas de "incluye") | #4D6B3C | 4,8:1 sobre #F1E4CC |
| WhatsApp | #157F45 con texto blanco | 5,1:1 |

## Forma
- Radios: fotos **6 px**, botones y campos **4 px** (nada de píldoras). Chips rectangulares.
- Sombras: casi ninguna; solo lo que flota (hoja del cotizador, visor, barra de abajo).
- Motivo: 3 a 9 líneas de viento paralelas, trazo de 1,2 px, en arena honda sobre arena o en coral claro sobre azul.

## Páginas (19)
| Página | Lleva |
|---|---|
| index.html | Portada "El viento sobre el médano", buscador rápido, **su presupuesto** (novedad), salidas destacadas, **lo que tiene cerca en Paraguaná**, destinos en galería horizontal, servicios, cómo funciona, cierre |
| paquetes.html | Catálogo con filtros en la URL (tipo, destino, duración, personas), panel Filtrar en el teléfono, contador, vacío amable y comparador de 2 o 3 |
| paquete-<id>.html (10) | Galería con visor, qué incluye y qué no, día por día, precio de ejemplo, mini cotizador, su maleta (la duna se llena) y otros paquetes |
| destinos.html | 11 destinos reales (5 nacionales, 6 internacionales) y los 4 lugares de Paraguaná para quien llega |
| servicios.html | Boletos (con su mini formulario), paquetes, hoteles, traslados, documentos y grupos |
| grupos.html | Empresas, graduaciones, familias y amigos, con formulario que arma el WhatsApp |
| galeria.html | Mosaico con filtros (Paraguaná, playas, montaña y selva, ciudades) y visor |
| cotizar.html | Cotizador completo, políticas en pestañas y preguntas frecuentes |
| contacto.html | WhatsApp, Aeropuerto Josefa Camejo con "Cómo llegar", horario de ejemplo e instalar en el teléfono |
| creditos.html | Autor y licencia de cada foto y del video |

## Firma y momentos
1. **El viento sobre el médano** (firma): en la portada las líneas del viento se dibujan despacio sobre la arena y el mar sube detrás de ellas con borde de ola, hasta abrir la foto de los médanos; en computadora, después, se funde al video de las olas en líneas. En el teléfono, una sola vez al cargar. El titular y los botones se ven desde el primer instante.
2. **Novedad: "¿Cuánto quiere invertir?"**: un deslizador de presupuesto por persona; la arena de una duna sube con el monto, los paquetes que caben se encienden y el botón arma el WhatsApp con ese presupuesto.
3. **Lo que tiene cerca**: Médanos de Coro, Adícora, Cerro Santa Ana y Coro colonial, en una franja azul mar, cada uno con su botón para cotizar el traslado o el paseo.
4. Destinos en galería horizontal y comparador de paquetes.
5. La maleta de cada paquete: una duna que se llena con cada cosa marcada.

## Fotos y video
Wikimedia Commons por enlace (licencias libres), nada descargado. Video de la portada: "Ocean surface waves 03" (CC0), 480p, 2 MB, solo en computadora con buena conexión.

## Instalable
`manifest.webmanifest` con azul mar y arena, `sw.js`, íconos 192, 512 y maskable con las líneas del médano y "PF".
