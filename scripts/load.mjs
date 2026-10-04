// Carga los datos del proyecto (plantas, familias, glosario, guías).
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontMatter } from './md.mjs';

function readJson(file, onError) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { (onError ?? ((m) => { throw new Error(m); }))(`${path.basename(file)}: ${e.message}`.replace(/^/, 'JSON ')); return null; }
}

export function loadAll(root, { tolerant = false, onError } = {}) {
  const dir = (...p) => path.join(root, ...p);
  const plantas = [];
  const pdir = dir('data', 'plantas');
  if (fs.existsSync(pdir)) {
    for (const f of fs.readdirSync(pdir).filter((x) => x.endsWith('.json')).sort()) {
      const arr = readJson(path.join(pdir, f), tolerant ? onError : undefined);
      if (Array.isArray(arr)) arr.forEach((p) => plantas.push(p));
    }
  }
  const opt = (rel) => (fs.existsSync(dir(...rel)) ? readJson(dir(...rel), tolerant ? onError : undefined) ?? [] : []);
  const familias = opt(['data', 'familias.json']);
  const glosario = opt(['data', 'glosario.json']);
  const problemas = opt(['data', 'problemas.json']);
  const guias = [];
  const gdir = dir('content', 'guias');
  if (fs.existsSync(gdir)) {
    for (const f of fs.readdirSync(gdir).filter((x) => x.endsWith('.md')).sort()) {
      const { meta, body } = parseFrontMatter(fs.readFileSync(path.join(gdir, f), 'utf8'));
      guias.push({ slug: f.replace(/\.md$/, ''), meta, body });
    }
  }
  guias.sort((a, b) => (+a.meta.orden || 99) - (+b.meta.orden || 99));
  plantas.sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es'));
  return { plantas, familias, glosario, guias, problemas };
}
