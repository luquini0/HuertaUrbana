# 🌱 Plantbook

**El manual abierto de huertas, jardines, frutales y árboles.** Gratis, en español, sin publicidad y hecho para crecer con ayuda de todos.

Del balcón a la chacra: cómo germinar semillas, plantar en macetas, multiplicar plantas (esquejes, división, acodo, injerto), qué sembrar cada mes según tu hemisferio y tu zona, y fichas completas de hortalizas, aromáticas, flores, frutales y árboles.

🌐 **Sitio:** https://luquini0.github.io/HuertaUrbana/

## Qué incluye

- **Fichas de plantas** (`data/plantas/`): calendario anual, germinación, distancias, riego, maceta, multiplicación, asociaciones, plagas, cosecha y variedades.
- **Guías paso a paso** (`content/guias/`): empezar, tamaños de huerta, suelo y compost, germinación, almácigos, macetas, riego, multiplicación, familias botánicas, ciclos y estaciones, siembras por estación, rotación, plagas, semillas, flores y polinizadores, frutales y árboles, cosecha y conservación.
- **Calendario interactivo** para hemisferio sur o norte y zonas fría/templada/cálida.
- **Calculadoras**: tamaño de macetas, plantas por m², fecha estimada de cosecha.
- **Familias botánicas, glosario y diagnóstico de problemas.**
- Búsqueda, modo oscuro, fichas imprimibles y funcionamiento sin conexión.

## Cómo está hecho

Todo el contenido son archivos abiertos (JSON y Markdown). Un script de Node (sin dependencias) los convierte en un sitio estático que se publica con GitHub Pages desde `docs/`.

```
data/        plantas, familias, glosario y diagnóstico (JSON) + ESQUEMA.md
content/     guías en Markdown
src/         estilos, JavaScript del navegador y recursos
scripts/     validate.mjs, build.mjs, serve.mjs
docs/        sitio generado (lo que publica GitHub Pages)
```

```bash
node scripts/validate.mjs   # valida los datos
node scripts/build.mjs      # genera docs/
node scripts/serve.mjs      # prueba local en http://localhost:8080/HuertaUrbana/
```

## Colaborar

¡Toda ayuda suma! Mirá [CONTRIBUTING.md](CONTRIBUTING.md). Podés corregir un dato de tu zona, sumar una planta, escribir una guía o traducir.

> ⚠️ La información es orientativa y parte de clima templado del hemisferio sur. Cada huerta es distinta. Las fichas se están revisando con especialistas y fuentes locales (INTA / Pro-Huerta): si encontrás un error, abrí un *issue*.

## Licencias

- **Contenido** (`data/`, `content/`): [CC BY-SA 4.0](LICENSE-CONTENT.md)
- **Código** (`scripts/`, `src/`): [MIT](LICENSE)
