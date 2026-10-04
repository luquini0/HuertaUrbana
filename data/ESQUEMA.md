# Esquema de datos de Huerta Urbana

Todo el contenido vive en `data/` y `content/`. El sitio se genera con `node scripts/build.mjs`.
Validá tus cambios con `node scripts/validate.mjs`.

## Plantas — `data/plantas/<categoria>.json`

Cada archivo es un **arreglo JSON** de plantas. Una planta:

```json
{
  "id": "tomate",
  "nombre": "Tomate",
  "otros": ["jitomate"],
  "cientifico": "Solanum lycopersicum",
  "familia": "solanaceas",
  "tipo": "hortaliza",
  "grupo": "fruto",
  "emoji": "🍅",
  "ciclo": "anual",
  "estacion": "calida",
  "descripcion": "Una o dos frases claras.",
  "sol": "pleno",
  "riego": "medio",
  "dificultad": 2,
  "meses": { "almacigo": [8, 9], "directa": [], "trasplante": [10, 11], "cosecha": [1, 2, 3, 4] },
  "germinacion_dias": [5, 10],
  "germinacion_temp": "20-25 °C",
  "profundidad_cm": 0.5,
  "distancia_cm": { "plantas": 50, "filas": 80 },
  "cosecha_dias": [70, 90],
  "cosecha_anios": null,
  "maceta_litros": 20,
  "suelo": "Texto breve.",
  "como_cultivar": ["Paso 1", "Paso 2"],
  "en_maceta": "Texto breve.",
  "multiplicacion": ["Semilla: ...", "Esqueje: ..."],
  "companeras": ["albahaca"],
  "enemigas": ["papa"],
  "plagas": ["Mosca blanca: síntoma y manejo."],
  "cosecha_y_uso": "Texto breve.",
  "consejos": ["Consejo 1"],
  "variedades": ["Cherry", "Perita"]
}
```

### Campos y valores permitidos

- `id`: minúsculas, sin tildes, con guiones. Único en todo el proyecto.
- `tipo`: `hortaliza` | `aromatica` | `flor` | `frutal` | `arbol`.
- `grupo`: texto libre corto en minúsculas. Sugeridos: `fruto`, `hoja`, `raiz`, `bulbo`, `legumbre`, `tallo`, `hierba`, `flor-comestible`, `flor-ornamental`, `carozo`, `pepita`, `citrico`, `frutal-menor`, `vid`, `fruto-seco`, `arbol-sombra`, `arbol-nativo`.
- `ciclo`: `anual` | `bienal` | `perenne`.
- `estacion`: `calida` (sensible a heladas, se siembra en primavera/verano), `fria` (tolera frío, se siembra fin de verano/otoño o a la salida del invierno) o `perenne` (frutales, árboles y perennes: su calendario no se corre por zona).
- `sol`: `pleno` (6+ h de sol directo) | `medio` (3–6 h) | `sombra`.
- `riego`: `bajo` | `medio` | `alto`.
- `dificultad`: 1 (fácil), 2 (media), 3 (exigente).
- `meses`: números 1–12, **para hemisferio sur, clima templado con heladas invernales** (ej.: Mendoza, Gran Buenos Aires, Córdoba). El sitio los desplaza para el hemisferio norte y para zonas frías/cálidas.
  - `almacigo`: meses para sembrar en almácigo/semillero bajo reparo.
  - `directa`: siembra directa en el lugar definitivo.
  - `trasplante`: meses para llevar a lugar definitivo plantines, esquejes, bulbos, tubérculos-semilla, plantas de vivero. (Para frutales/árboles de raíz desnuda: invierno; en maceta/cepellón: casi todo el año fuera de heladas.)
  - `cosecha`: meses en que se cosecha.
  - Dejá `[]` si no aplica.
- `germinacion_dias`: `[mín, máx]` o `null` (si no se hace por semilla casera).
- `distancia_cm`: `{ "plantas": n, "filas": n }`. Para árboles y frutales: distancia entre ejemplares en ambos campos (ej. 400 y 400).
- `cosecha_dias`: `[mín, máx]` días **desde siembra directa o desde trasplante** hasta cosecha, o `null` en perennes/árboles.
- `cosecha_anios`: `[mín, máx]` años hasta la primera cosecha (solo frutales/árboles/perennes de producción lenta), si no `null`.
- `maceta_litros`: litros de sustrato **mínimos por planta**; `null` si no es apta para maceta.
- `companeras` / `enemigas`: arreglos de `id` de otras plantas del proyecto (el validador falla si el id no existe).
- Textos: español claro, voseo rioplatense (“sembrá”, “regá”), frases cortas, sin relleno. Datos prudentes y verificables; si algo depende mucho del clima, decilo.

## Familias — `data/familias.json`

Arreglo de `{ id, nombre, cientifico, emoji, descripcion, rasgos: [..], rotacion: "hojas"|"frutos"|"raices"|"leguminosas"|"perennes"|"flores", cuidado: "texto" }`.

## Glosario — `data/glosario.json`

Arreglo de `{ termino, definicion }` ordenado alfabéticamente.

## Guías — `content/guias/<slug>.md`

Markdown con encabezado:

```
---
title: Cómo germinar semillas
resumen: Una frase que explica de qué trata la guía.
orden: 4
emoji: 🌱
---
```

- Usá `##` y `###` para secciones (no `#`; el título sale del encabezado).
- Tablas con `|`, listas con `-` y `1.`, **negrita**, *cursiva*.
- Avisos: `> [!TIP] texto`, `> [!OJO] texto`, `> [!DATO] texto`.
- Enlaces internos: `[tomate](planta:tomate)`, `[Germinación](guia:germinacion)`, `[Solanáceas](familia:solanaceas)`, `[calendario](pagina:calendario)`, `[herramientas](pagina:herramientas)`, `[glosario](pagina:glosario)`.
- Las siembras se refieren al hemisferio sur templado (aclarar el cambio para el norte cuando haga falta).

## Licencias

El **contenido** (`data/`, `content/`) es CC BY-SA 4.0. El **código** (`scripts/`, `src/`) es MIT.
