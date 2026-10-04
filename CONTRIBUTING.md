# Cómo colaborar con Plantbook

¡Gracias por querer sumar! No hace falta saber programar: la mayor parte del trabajo es escribir y revisar datos sobre plantas.

## Formas de ayudar

1. **Corregir un dato.** ¿Una fecha no coincide con tu zona? ¿Una distancia está mal? Abrí un *issue* ("Dato incorrecto") o editá el archivo directamente desde GitHub.
2. **Sumar una planta.** Copiá una ficha de `data/plantas/`, cambiala y agregala al archivo de su categoría. El esquema completo está en [`data/ESQUEMA.md`](data/ESQUEMA.md).
3. **Escribir o mejorar una guía** en `content/guias/` (Markdown).
4. **Aportar datos de tu región** (fechas de heladas, variedades criollas, plagas locales).
5. **Traducir** el contenido a otro idioma.
6. **Mejorar el código** del sitio (`src/`, `scripts/`).

## Flujo de trabajo

```bash
git clone https://github.com/luquini0/HuertaUrbana.git
cd HuertaUrbana
# editá archivos en data/ o content/
node scripts/validate.mjs     # tiene que terminar en OK
node scripts/build.mjs        # regenera docs/
git add -A && git commit -m "Agrego <planta>"
```

Abrí un *Pull Request*. La integración continua valida los datos y comprueba que `docs/` esté regenerado: **siempre ejecutá `build` antes de commitear**.

## Criterios de calidad

- **Datos verificables y prudentes.** Preferí rangos y citá fuentes (INTA, Pro-Huerta, universidades, manuales). Si algo depende del clima, decilo.
- **Meses** siempre para hemisferio sur templado; el sitio los desplaza solo.
- **Manejo ecológico:** nada de agrotóxicos; para cualquier preparado, incluí precauciones.
- **Voseo rioplatense**, frases cortas, sin relleno.
- **Seguridad:** ante plantas tóxicas, conservas o usos medicinales, advertí con claridad y no prometas curas.
- Los ids son minúsculas, sin tildes, con guiones (`cebolla-de-verdeo`).

## Licencias de tus aportes

Al aportar aceptás que tu contenido se publique bajo **CC BY-SA 4.0** y tu código bajo **MIT**.

## Convivencia

Leé el [Código de convivencia](CODE_OF_CONDUCT.md). Aprendemos juntos.
