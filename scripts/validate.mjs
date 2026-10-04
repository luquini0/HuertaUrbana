// Valida los datos del proyecto. Uso: node scripts/validate.mjs [--solo plantas|familias|guias]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAll } from './load.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const solo = process.argv.includes('--solo') ? process.argv[process.argv.indexOf('--solo') + 1] : null;
const errors = [];
const warns = [];
const err = (w, m) => errors.push(`✗ ${w}: ${m}`);
const warn = (w, m) => warns.push(`! ${w}: ${m}`);

const TIPOS = ['hortaliza', 'aromatica', 'flor', 'frutal', 'arbol'];
const CICLOS = ['anual', 'bienal', 'perenne'];
const ESTACIONES = ['calida', 'fria', 'perenne'];
const SOL = ['pleno', 'medio', 'sombra'];
const RIEGO = ['bajo', 'medio', 'alto'];
const ROT = ['hojas', 'frutos', 'raices', 'leguminosas', 'perennes', 'flores'];

const { plantas, familias, glosario, guias, problemas } = loadAll(ROOT, { tolerant: true, onError: err });
const ids = new Set();
const famIds = new Set(familias.map((f) => f.id));

const isMonths = (a) => Array.isArray(a) && a.every((n) => Number.isInteger(n) && n >= 1 && n <= 12);
const isRange = (a) => Array.isArray(a) && a.length === 2 && a.every((n) => typeof n === 'number') && a[0] <= a[1];
const isStr = (s) => typeof s === 'string' && s.trim().length > 0;

if (!solo || solo === 'plantas') {
  for (const p of plantas) {
    const w = `planta ${p.id ?? '(sin id)'}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id ?? '')) err(w, 'id inválido (minúsculas, sin tildes, con guiones)');
    if (ids.has(p.id)) err(w, 'id duplicado'); ids.add(p.id);
    for (const k of ['nombre', 'cientifico', 'familia', 'emoji', 'descripcion', 'suelo', 'en_maceta', 'cosecha_y_uso', 'grupo'])
      if (!isStr(p[k])) err(w, `falta "${k}"`);
    if (!TIPOS.includes(p.tipo)) err(w, `tipo inválido (${p.tipo})`);
    if (!CICLOS.includes(p.ciclo)) err(w, `ciclo inválido (${p.ciclo})`);
    if (!ESTACIONES.includes(p.estacion)) err(w, `estacion inválida (${p.estacion})`);
    if (!SOL.includes(p.sol)) err(w, `sol inválido (${p.sol})`);
    if (!RIEGO.includes(p.riego)) err(w, `riego inválido (${p.riego})`);
    if (![1, 2, 3].includes(p.dificultad)) err(w, 'dificultad debe ser 1, 2 o 3');
    if (famIds.size && !famIds.has(p.familia)) err(w, `familia desconocida (${p.familia})`);
    if (!p.meses || typeof p.meses !== 'object') err(w, 'falta "meses"');
    else for (const k of ['almacigo', 'directa', 'trasplante', 'cosecha']) if (!isMonths(p.meses[k])) err(w, `meses.${k} debe ser arreglo de 1–12`);
    if (p.germinacion_dias !== null && !isRange(p.germinacion_dias)) err(w, 'germinacion_dias: [mín, máx] o null');
    if (p.cosecha_dias !== null && !isRange(p.cosecha_dias)) err(w, 'cosecha_dias: [mín, máx] o null');
    if (p.cosecha_anios !== null && !isRange(p.cosecha_anios)) err(w, 'cosecha_anios: [mín, máx] o null');
    if (p.maceta_litros !== null && !(typeof p.maceta_litros === 'number' && p.maceta_litros > 0)) err(w, 'maceta_litros: número o null');
    if (!(typeof p.profundidad_cm === 'number' || p.profundidad_cm === null)) err(w, 'profundidad_cm: número o null');
    if (!p.distancia_cm || !(p.distancia_cm.plantas > 0) || !(p.distancia_cm.filas > 0)) err(w, 'distancia_cm necesita plantas y filas > 0');
    for (const k of ['como_cultivar', 'multiplicacion', 'plagas', 'consejos'])
      if (!Array.isArray(p[k]) || !p[k].length || !p[k].every(isStr)) err(w, `"${k}" debe ser arreglo de textos no vacío`);
    if (Array.isArray(p.como_cultivar) && p.como_cultivar.length < 4) warn(w, 'como_cultivar con menos de 4 pasos');
    for (const k of ['companeras', 'enemigas', 'variedades']) if (!Array.isArray(p[k])) err(w, `"${k}" debe ser arreglo`);
    if (p.tipo === 'hortaliza' && p.estacion === 'perenne' && !['alcaucil', 'esparrago'].includes(p.id)) warn(w, 'hortaliza con estacion perenne');
    if (p.estacion === 'perenne' && !p.cosecha_anios && ['frutal', 'arbol'].includes(p.tipo)) warn(w, 'falta cosecha_anios');
  }
  const all = new Set(plantas.map((p) => p.id));
  for (const p of plantas) for (const k of ['companeras', 'enemigas'])
    for (const r of p[k] ?? []) if (!all.has(r)) err(`planta ${p.id}`, `${k}: "${r}" no existe`);
}

if (!solo || solo === 'familias') {
  for (const f of familias) {
    const w = `familia ${f.id}`;
    for (const k of ['id', 'nombre', 'cientifico', 'emoji', 'descripcion', 'cuidado']) if (!isStr(f[k])) err(w, `falta "${k}"`);
    if (!ROT.includes(f.rotacion)) err(w, `rotacion inválida (${f.rotacion})`);
    if (!Array.isArray(f.rasgos) || !f.rasgos.length) err(w, 'faltan rasgos');
  }
  const used = new Set(plantas.map((p) => p.familia));
  for (const u of used) if (famIds.size && !famIds.has(u)) err('familias', `la familia "${u}" se usa pero no está definida`);
}

if (!solo || solo === 'guias') {
  for (const g of guias) {
    const w = `guía ${g.slug}`;
    for (const k of ['title', 'resumen', 'emoji']) if (!isStr(g.meta[k])) err(w, `falta "${k}" en el encabezado`);
    if (!(+g.meta.orden > 0)) err(w, 'falta "orden" numérico');
    if (g.body.length < 1500) warn(w, `muy corta (${g.body.length} caracteres)`);
    const links = [...g.body.matchAll(/\]\((planta|guia|familia|pagina):([^)]+)\)/g)];
    for (const [, kind, target] of links) {
      if (kind === 'planta' && plantas.length && !plantas.some((p) => p.id === target)) warn(w, `enlace a planta inexistente: ${target}`);
      if (kind === 'guia' && !guias.some((x) => x.slug === target)) warn(w, `enlace a guía inexistente: ${target}`);
      if (kind === 'familia' && familias.length && !famIds.has(target)) warn(w, `enlace a familia inexistente: ${target}`);
    }
  }
}

for (const g of glosario) if (!isStr(g.termino) || !isStr(g.definicion)) err('glosario', `entrada inválida: ${JSON.stringify(g).slice(0, 60)}`);
for (const p of problemas ?? []) for (const k of ['sintoma', 'causas', 'solucion']) if (!isStr(p[k])) err('problemas', `falta "${k}" en ${JSON.stringify(p).slice(0, 50)}`);

console.log(`Plantas: ${plantas.length} · Familias: ${familias.length} · Guías: ${guias.length} · Glosario: ${glosario.length}`);
warns.forEach((w) => console.log(w));
errors.forEach((e) => console.log(e));
if (errors.length) { console.log(`\n${errors.length} error(es)`); process.exit(1); }
console.log('OK');
