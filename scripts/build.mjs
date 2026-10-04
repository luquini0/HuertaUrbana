// Genera el sitio estático de Plantbook en docs/. Uso: node scripts/build.mjs
// Variables: PB_BASE (ruta base, por defecto /HuertaUrbana) · PB_SITE (URL pública sin barra final).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadAll } from './load.mjs';
import { renderMarkdown, slugify } from './md.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs');
const BASE = process.env.PB_BASE ?? '/HuertaUrbana';
const SITE = process.env.PB_SITE ?? 'https://luquini0.github.io/HuertaUrbana';
const NAME = 'Plantbook';
const GA = 'G-Y6E1P9DPKN';
const TODAY = new Date().toISOString().slice(0, 10);

const { plantas, familias, glosario, guias, problemas } = loadAll(ROOT);
const famById = Object.fromEntries(familias.map((f) => [f.id, f]));
const plantById = Object.fromEntries(plantas.map((p) => [p.id, p]));
const guiaBySlug = Object.fromEntries(guias.map((g) => [g.slug, g]));

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const TIPOS = {
  hortaliza: { n: 'Hortalizas', s: 'Hortaliza', e: '🥕', d: 'Verduras, legumbres y hortalizas para la mesa de todos los días.' },
  aromatica: { n: 'Aromáticas', s: 'Aromática', e: '🌿', d: 'Hierbas para cocinar, aromatizar y atraer insectos benéficos.' },
  flor: { n: 'Flores', s: 'Flor', e: '🌼', d: 'Flores comestibles y ornamentales que cuidan la huerta.' },
  frutal: { n: 'Frutales', s: 'Frutal', e: '🍑', d: 'Árboles y arbustos frutales, de patio a huerto.' },
  arbol: { n: 'Árboles', s: 'Árbol', e: '🌳', d: 'Árboles nativos y de sombra para el jardín y la calle.' },
};
const SOL = { pleno: '☀️ Pleno sol', medio: '⛅ Sol parcial', sombra: '🌥️ Sombra' };
const RIEGO = { bajo: '💧 Bajo', medio: '💧💧 Medio', alto: '💧💧💧 Alto' };
const CICLO = { anual: 'Anual', bienal: 'Bienal', perenne: 'Perenne' };

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const href = (p) => `${BASE}${p}`;
const abs = (p) => `${SITE}${p}`;
const range = (r, unit) => (r ? (r[0] === r[1] ? `${r[0]} ${unit}` : `${r[0]}–${r[1]} ${unit}`) : '—');
const monthsText = (a) => (a.length ? a.map((m) => MESES[m - 1]).join(', ') : '—');

function resolve(u) {
  const m = u.match(/^(planta|guia|familia|pagina):(.+)$/);
  if (!m) return u;
  const [, k, t] = m;
  if (k === 'planta') return href(`/plantas/${t}/`);
  if (k === 'guia') return href(`/guias/${t}/`);
  if (k === 'familia') return href(`/familias/${t}/`);
  return href(`/${t}/`);
}

// ---------- archivos ----------
const written = [];
function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
  written.push(rel);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const css = fs.readFileSync(path.join(ROOT, 'src/css/styles.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'src/js/app.js'), 'utf8');
const hash = crypto.createHash('sha1').update(css + js).digest('hex').slice(0, 8);
write('assets/styles.css', css);
write('assets/app.js', js);
fs.copyFileSync(path.join(ROOT, 'src/assets/logo.png'), path.join(OUT, 'assets/logo.png'));
for (const f of ['og-image.png', 'icon-192.png', 'icon-512.png']) {
  const p = path.join(ROOT, 'src/assets', f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(OUT, f));
}
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// ---------- plantilla ----------
const NAV = [
  ['/plantas/', 'Plantas'], ['/guias/', 'Guías'], ['/calendario/', 'Calendario'],
  ['/herramientas/', 'Herramientas'], ['/familias/', 'Familias'], ['/glosario/', 'Glosario'],
];

function layout({ title, desc, path: p, body, active = '', jsonld = null, noindex = false }) {
  const full = p === '/' ? NAME + ' — manual abierto de huertas, jardines y frutales' : `${title} · ${NAME}`;
  const url = abs(p);
  return `<!doctype html>
<html lang="es" data-base="${BASE}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${noindex ? 'noindex' : 'index, follow, max-image-preview:large'}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${p === '/' ? 'website' : 'article'}">
<meta property="og:site_name" content="${NAME}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${abs('/og-image.png')}">
<meta property="og:locale" content="es_AR">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#3f7d4f">
<link rel="icon" type="image/png" href="${href('/assets/logo.png')}">
<link rel="manifest" href="${href('/manifest.webmanifest')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${href('/assets/styles.css')}?v=${hash}">
<script>try{var t=localStorage.getItem('hu_theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA}');</script>
</head>
<body>
<a class="skip" href="#main">Saltar al contenido</a>
<header class="site"><div class="wrap">
  <a class="brand" href="${href('/')}"><img src="${href('/assets/logo.png')}" alt="" width="32" height="32">${NAME}</a>
  <nav class="main" aria-label="Principal">${NAV.map(([u, n]) => `<a href="${href(u)}"${active === u ? ' aria-current="page"' : ''}>${n}</a>`).join('')}</nav>
  <div class="hdr-tools"><button class="icon-btn" id="theme-btn" type="button" aria-label="Cambiar tema claro/oscuro">◐</button>
  <button class="icon-btn menu-btn" type="button" aria-label="Abrir menú" aria-expanded="false">☰</button></div>
</div></header>
<main id="main">
${body}
</main>
<footer class="site"><div class="wrap">
  <div class="cols">
    <div><h4>🌱 ${NAME}</h4><p>Manual abierto para cultivar huertas, jardines, frutales y árboles. Hecho por la comunidad, gratis para siempre.</p></div>
    <div><h4>Explorar</h4><a href="${href('/plantas/')}">Todas las plantas</a><a href="${href('/guias/')}">Guías paso a paso</a><a href="${href('/calendario/')}">Calendario de siembra</a><a href="${href('/herramientas/')}">Calculadoras</a></div>
    <div><h4>Aprender</h4><a href="${href('/guias/empezar/')}">Empezar desde cero</a><a href="${href('/familias/')}">Familias botánicas</a><a href="${href('/problemas/')}">Diagnóstico de problemas</a><a href="${href('/glosario/')}">Glosario</a></div>
    <div><h4>Proyecto</h4><a href="${href('/acerca/')}">Acerca de ${NAME}</a><a href="https://github.com/luquini0/HuertaUrbana">Código y contenido en GitHub</a><a href="https://github.com/luquini0/HuertaUrbana/blob/main/CONTRIBUTING.md">Cómo colaborar</a><span>Contenido CC BY-SA 4.0 · Código MIT</span></div>
  </div>
</div></footer>
<script src="${href('/assets/app.js')}?v=${hash}" defer></script>
</body>
</html>`;
}

const crumbs = (items) => `<nav class="crumbs wrap" aria-label="Migas de pan">${items.map(([u, n]) => (u ? `<a href="${href(u)}">${esc(n)}</a>` : `<span>${esc(n)}</span>`)).join(' › ')}</nav>`;
const searchBox = (ph = 'Buscá una planta o una guía… (ej: tomate, esquejes)') =>
  `<div class="searchbox"><input type="search" data-search placeholder="${ph}" aria-label="Buscar" autocomplete="off"></div>`;


// Rueda del año decorativa (hemisferio sur): cada mes un gajo coloreado por estación.
function yearWheel() {
  const cx = 160, cy = 160, r1 = 70, r2 = 150;
  const col = ['#d97b4f','#d97b4f','#e0a63a','#e0a63a','#e0a63a','#3a8f9a','#3a8f9a','#3a8f9a','#7cb87f','#7cb87f','#7cb87f','#d97b4f'];
  const pt = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  let paths = '', labels = '';
  for (let m = 0; m < 12; m++) {
    const a0 = (m / 12) * 2 * Math.PI - Math.PI / 2 + 0.02, a1 = ((m + 1) / 12) * 2 * Math.PI - Math.PI / 2 - 0.02;
    const [x0, y0] = pt(a0, r2), [x1, y1] = pt(a1, r2), [x2, y2] = pt(a1, r1), [x3, y3] = pt(a0, r1);
    paths += '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r2 + ' ' + r2 + ' 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' A' + r1 + ' ' + r1 + ' 0 0 0 ' + x3.toFixed(1) + ' ' + y3.toFixed(1) + ' Z" fill="' + col[m] + '" opacity=".92"/>';
    const am = (a0 + a1) / 2, [lx, ly] = pt(am, (r1 + r2) / 2);
    labels += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Inter,sans-serif">' + MESES[m] + '</text>';
  }
  return '<svg viewBox="0 0 320 320" role="img" aria-label="Rueda del año: verano, otoño, invierno y primavera en el hemisferio sur" class="wheel">' + paths + labels +
    '<text x="160" y="150" text-anchor="middle" font-size="40">🌱</text><text x="160" y="178" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor" font-family="Inter,sans-serif">el año</text><text x="160" y="194" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor" font-family="Inter,sans-serif">de tu huerta</text></svg>';
}

// ---------- piezas ----------
function plantCard(p) {
  return `<a class="card plant-card" href="${href(`/plantas/${p.id}/`)}" data-card data-tipo="${p.tipo}" data-sol="${p.sol}" data-dif="${p.dificultad}" data-maceta="${p.maceta_litros && p.maceta_litros <= 30 ? 1 : 0}" data-k="${esc([p.nombre, p.cientifico, ...p.otros ?? [], p.grupo, famById[p.familia]?.nombre ?? ''].join(' '))}">
  <span class="emoji" aria-hidden="true">${p.emoji}</span>
  <h3>${esc(p.nombre)}</h3><span class="sci">${esc(p.cientifico)}</span>
  <div class="chips"><span class="chip">${TIPOS[p.tipo].s}</span><span class="chip a">${'●'.repeat(p.dificultad)}${'○'.repeat(3 - p.dificultad)} ${['fácil', 'media', 'exigente'][p.dificultad - 1]}</span></div>
</a>`;
}

function stripHTML(p) {
  let h = '<div class="strip" role="img" aria-label="Calendario anual (hemisferio sur, zona templada)">';
  for (let m = 1; m <= 12; m++) {
    const a = p.meses.almacigo.includes(m), d = p.meses.directa.includes(m), t = p.meses.trasplante.includes(m), c = p.meses.cosecha.includes(m);
    const cls = (a || d || t) && c ? 'multi' : c ? 'm-c' : a ? 'm-a' : t ? 'm-t' : d ? 'm-d' : '';
    h += `<div class="${cls}" title="${MESES_L[m - 1]}"><b>${MESES[m - 1]}</b><span>${a ? 'A ' : ''}${d ? 'S ' : ''}${t ? 'T ' : ''}${c ? 'C' : ''}</span></div>`;
  }
  return h + '</div>';
}

const chipsFor = (ids) => ids.filter((i) => plantById[i]).map((i) => `<a class="chip" href="${href(`/plantas/${i}/`)}">${plantById[i].emoji} ${esc(plantById[i].nombre)}</a>`).join('') || '<span class="empty">—</span>';
const list = (arr) => `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
const ol = (arr) => `<ol>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;

function plantPage(p) {
  const fam = famById[p.familia];
  const isTree = p.tipo === 'frutal' || p.tipo === 'arbol';
  const stripData = esc(JSON.stringify({ n: p.nombre, est: p.estacion, a: p.meses.almacigo, d: p.meses.directa, tr: p.meses.trasplante, c: p.meses.cosecha }));
  const sameFam = plantas.filter((x) => x.familia === p.familia && x.id !== p.id);
  const guideLinks = [];
  if (p.maceta_litros) guideLinks.push(['macetas', 'Plantar en macetas']);
  if (p.meses.almacigo.length) guideLinks.push(['almacigos-y-trasplante', 'Almácigos y trasplante']);
  guideLinks.push(['germinacion', 'Cómo germinar'], ['multiplicacion', 'Multiplicación'], ['plagas-y-enfermedades', 'Plagas y enfermedades']);
  const facts = [
    ['Tipo', `${TIPOS[p.tipo].s} · ${p.grupo.replace(/-/g, ' ')}`], ['Ciclo', CICLO[p.ciclo]], ['Sol', SOL[p.sol]], ['Riego', RIEGO[p.riego]],
    ['Dificultad', `<span class="diff">${'★'.repeat(p.dificultad)}${'☆'.repeat(3 - p.dificultad)}</span> ${['Fácil', 'Media', 'Exigente'][p.dificultad - 1]}`],
    ['Germinación', p.germinacion_dias ? `${range(p.germinacion_dias, 'días')}${p.germinacion_temp ? ` · ${esc(p.germinacion_temp)}` : ''}` : 'No se hace por semilla casera'],
    ['Profundidad de siembra', p.profundidad_cm != null ? `${p.profundidad_cm} cm` : '—'],
    [isTree ? 'Distancia entre ejemplares' : 'Distancia', isTree ? `${(p.distancia_cm.plantas / 100).toFixed(p.distancia_cm.plantas % 100 ? 1 : 0)} m` : `${p.distancia_cm.plantas} cm entre plantas · ${p.distancia_cm.filas} cm entre filas`],
    [p.cosecha_anios ? 'Primera cosecha' : 'A la cosecha', p.cosecha_anios ? range(p.cosecha_anios, 'años') : range(p.cosecha_dias, 'días')],
    ['Maceta', p.maceta_litros ? `≥ ${p.maceta_litros} L por planta` : 'No recomendada'],
  ].map(([k, v]) => `<div class="fact"><small>${k}</small><b>${v}</b></div>`).join('');

  const body = `${crumbs([['/', 'Inicio'], ['/plantas/', 'Plantas'], [null, p.nombre]])}
<article class="wrap">
  <div class="sheet-head"><span class="emoji" aria-hidden="true">${p.emoji}</span><div>
    <span class="tag">${TIPOS[p.tipo].n}${fam ? ` · <a href="${href(`/familias/${fam.id}/`)}">${esc(fam.nombre)}</a>` : ''}</span>
    <h1>${esc(p.nombre)}</h1><p class="sci">${esc(p.cientifico)}${p.otros?.length ? ` · también: ${esc(p.otros.join(', '))}` : ''}</p></div></div>
  <p class="prose" style="font-size:1.1rem;max-width:760px">${esc(p.descripcion)}</p>
  <div class="facts">${facts}</div>
  <h2>Calendario del año</h2>
  <div data-widget="strip" data-plant="${stripData}"><div class="strip-host">${stripHTML(p)}</div>
    <div class="legend"><span><i class="dot almacigo"></i>A · Almácigo</span><span><i class="dot directa"></i>S · Siembra directa</span><span><i class="dot trasplante"></i>T · ${isTree ? 'Plantación' : 'Trasplante'}</span><span><i class="dot cosecha"></i>C · ${p.tipo === 'flor' || p.tipo === 'arbol' ? 'Floración' : 'Cosecha'}</span></div></div>
  <div class="prose">
    <h2>Cómo cultivarlo</h2>${ol(p.como_cultivar)}
    <h2>Suelo</h2><p>${esc(p.suelo)}</p>
    <h2>En maceta</h2><p>${esc(p.en_maceta)}</p>
    <h2>Cómo multiplicarlo</h2>${list(p.multiplicacion)}
  </div>
  <div class="two">
    <div class="good"><h2>Buenas compañeras</h2><div class="chips">${chipsFor(p.companeras)}</div></div>
    <div class="bad"><h2>Mejor lejos de…</h2><div class="chips">${chipsFor(p.enemigas)}</div></div>
  </div>
  <div class="prose">
    <h2>Plagas y problemas</h2>${list(p.plagas)}
    <h2>Cosecha y uso</h2><p>${esc(p.cosecha_y_uso)}</p>
    <h2>Consejos</h2>${list(p.consejos)}
    ${p.variedades?.length ? `<h2>Variedades para probar</h2><div class="chips">${p.variedades.map((v) => `<span class="chip">${esc(v)}</span>`).join('')}</div>` : ''}
  </div>
  <h2>Guías relacionadas</h2><div class="chips">${guideLinks.map(([s, n]) => guiaBySlug[s] ? `<a class="chip" href="${href(`/guias/${s}/`)}">${esc(n)}</a>` : '').join('')}</div>
  ${sameFam.length ? `<h2>Misma familia${fam ? ` (${esc(fam.nombre)})` : ''}</h2><div class="chips">${sameFam.map((x) => `<a class="chip" href="${href(`/plantas/${x.id}/`)}">${x.emoji} ${esc(x.nombre)}</a>`).join('')}</div>` : ''}
  <p class="no-print" style="margin:30px 0"><button class="btn btn-ghost" onclick="window.print()">🖨️ Imprimir ficha</button></p>
</article>`;
  return layout({
    title: `${p.nombre}: cómo cultivar, sembrar y cuidar`, desc: `${p.nombre} (${p.cientifico}): ${p.descripcion} Calendario de siembra, cuidados, maceta, multiplicación y asociaciones.`.slice(0, 300),
    path: `/plantas/${p.id}/`, body, active: '/plantas/',
    jsonld: { '@context': 'https://schema.org', '@type': 'Article', headline: `${p.nombre}: cómo cultivar`, inLanguage: 'es', about: p.cientifico, publisher: { '@type': 'Organization', name: NAME } },
  });
}

// ---------- páginas ----------
const counts = Object.fromEntries(Object.keys(TIPOS).map((t) => [t, plantas.filter((p) => p.tipo === t).length]));
const featured = ['empezar', 'macetas', 'huerta-tamanos', 'germinacion', 'multiplicacion', 'siembras-por-estacion'].filter((s) => guiaBySlug[s]);

// Inicio
write('index.html', layout({
  title: NAME, path: '/', active: '',
  desc: `Plantbook es el manual abierto y gratuito para hacer huertas grandes, medianas y chicas: germinación, macetas, multiplicación, siembras por estación, hortalizas, flores, frutales y árboles.`,
  jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: abs('/'), inLanguage: 'es', potentialAction: { '@type': 'SearchAction', target: abs('/plantas/') + '?q={q}', 'query-input': 'required name=q' } },
  body: `<section class="hero"><div class="wrap hero-grid"><div>
  <span class="eyebrow">🌱 Manual abierto · gratis · en español</span>
  <h1>Todo lo que necesitás para hacer crecer tu huerta</h1>
  <p class="lead">Del balcón a la chacra: cómo germinar, plantar en macetas, multiplicar plantas, qué sembrar cada mes, y fichas de ${plantas.length} hortalizas, aromáticas, flores, frutales y árboles. Simple, creativo y hecho entre todos.</p>
  ${searchBox()}
  <p><a class="btn btn-primary" href="${href('/guias/empezar/')}">Empezar mi primera huerta</a> <a class="btn btn-ghost" href="${href('/calendario/')}">Qué sembrar ahora</a></p>
  </div><div class="hero-art" aria-hidden="false">${yearWheel()}<p class="wheel-cap"><span><i class="dot" style="background:#d97b4f"></i>Verano</span><span><i class="dot" style="background:#e0a63a"></i>Otoño</span><span><i class="dot" style="background:#3a8f9a"></i>Invierno</span><span><i class="dot" style="background:#7cb87f"></i>Primavera</span></p></div>
</div></section>
<section class="block"><div class="wrap">
  <div class="section-head"><span class="tag">Ahora mismo</span><h2 style="margin-top:6px">¿Qué hago este mes en la huerta?</h2><p>Elegí tu hemisferio y tu zona: te mostramos qué sembrar, trasplantar y cosechar.</p></div>
  <div class="now" data-widget="ahora"><noscript>Activá JavaScript para ver el calendario interactivo, o mirá la <a href="${href('/guias/siembras-por-estacion/')}">guía de siembras por estación</a>.</noscript></div>
</div></section>
<section class="block"><div class="wrap">
  <div class="section-head"><span class="tag">Caminos</span><h2 style="margin-top:6px">¿Por dónde querés empezar?</h2></div>
  <div class="grid g3">
    ${featured.map((s) => { const g = guiaBySlug[s].meta; return `<a class="card" href="${href(`/guias/${s}/`)}"><span class="big">${g.emoji}</span><h3>${esc(g.title)}</h3><p>${esc(g.resumen)}</p></a>`; }).join('')}
  </div>
  <p style="margin-top:16px"><a href="${href('/guias/')}">Ver todas las guías →</a></p>
</div></section>
<section class="block"><div class="wrap">
  <div class="section-head"><span class="tag">Explorar</span><h2 style="margin-top:6px">Plantas por tipo</h2></div>
  <div class="grid g3">${Object.entries(TIPOS).map(([k, t]) => `<a class="card" href="${href(`/plantas/?tipo=${k}`)}"><span class="big">${t.e}</span><h3>${t.n} <small style="font-weight:400;color:var(--ink-dim)">(${counts[k]})</small></h3><p>${t.d}</p></a>`).join('')}</div>
</div></section>
<section class="block"><div class="wrap">
  <div class="section-head"><span class="tag">Herramientas</span><h2 style="margin-top:6px">Calculá en vez de adivinar</h2></div>
  <div class="grid g3">
    <a class="card" href="${href('/herramientas/#maceta')}"><span class="big">🪴</span><h3>Calculadora de macetas</h3><p>¿Cuántas plantas entran en tu maceta?</p></a>
    <a class="card" href="${href('/herramientas/#huerta')}"><span class="big">📏</span><h3>Calculadora de huerta</h3><p>Cuántas plantas y semillas necesitás por m².</p></a>
    <a class="card" href="${href('/herramientas/#cosecha')}"><span class="big">🧺</span><h3>Fecha de cosecha</h3><p>Estimá cuándo cosechás lo que sembraste hoy.</p></a>
  </div>
</div></section>
<section class="block"><div class="wrap"><div class="card" style="padding:30px;background:var(--green-wash)">
  <span class="tag">Código abierto</span><h2 style="margin-top:6px">Un manual que crece con vos</h2>
  <p style="max-width:62ch">${NAME} es libre: el contenido es CC BY-SA 4.0 y el código es MIT. Si sabés algo de plantas de tu zona, corregí un dato, sumá una planta o traducí una guía. Cada aporte ayuda a que más gente cultive su comida.</p>
  <p style="margin-top:14px"><a class="btn btn-primary" href="${href('/acerca/')}">Cómo colaborar</a></p>
</div></div></section>`,
}));

// Plantas: índice y fichas
write('plantas/index.html', layout({
  title: 'Plantas: hortalizas, aromáticas, flores, frutales y árboles', path: '/plantas/', active: '/plantas/',
  desc: `${plantas.length} fichas de plantas con calendario de siembra, cuidados, maceta, multiplicación y asociaciones.`,
  body: `${crumbs([['/', 'Inicio'], [null, 'Plantas']])}
<div class="wrap" data-widget="filtro-plantas" style="padding-top:20px">
  <h1>Plantas</h1><p class="prose" style="color:var(--ink-dim)">Fichas con todo lo necesario para cultivar cada una. Filtrá por tipo, sol, dificultad o si sirve para maceta.</p>
  <div class="searchbox"><input type="search" data-q placeholder="Filtrar por nombre, familia, tipo…" aria-label="Filtrar plantas"></div>
  <div class="filters" role="group" aria-label="Tipo">${Object.entries(TIPOS).map(([k, t]) => `<button class="chip" type="button" data-filter="tipo" data-value="${k}" aria-pressed="false">${t.e} ${t.n}</button>`).join('')}</div>
  <div class="filters" role="group" aria-label="Más filtros">
    <button class="chip" type="button" data-filter="sol" data-value="pleno" aria-pressed="false">☀️ Pleno sol</button>
    <button class="chip" type="button" data-filter="sol" data-value="sombra" aria-pressed="false">🌥️ Sombra</button>
    <button class="chip" type="button" data-filter="dif" data-value="1" aria-pressed="false">Fáciles</button>
    <button class="chip" type="button" data-filter="maceta" data-value="1" aria-pressed="false">🪴 Aptas para maceta</button>
  </div>
  <p class="empty" data-count>${plantas.length} plantas</p>
  <div class="grid g4" style="margin-top:12px">${plantas.map(plantCard).join('\n')}</div>
</div>`,
}));
for (const p of plantas) write(`plantas/${p.id}/index.html`, plantPage(p));

// Familias
write('familias/index.html', layout({
  title: 'Familias botánicas', path: '/familias/', active: '/familias/',
  desc: 'Cada planta pertenece a una familia: conocerlas te ayuda a rotar cultivos, anticipar plagas y elegir buenas compañeras.',
  body: `${crumbs([['/', 'Inicio'], [null, 'Familias']])}<div class="wrap" style="padding-top:20px"><h1>Familias botánicas</h1>
  <p class="prose" style="color:var(--ink-dim)">Las plantas de una misma familia comparten plagas, enfermedades y necesidades. Es la base de la rotación de cultivos. <a href="${href('/guias/variedades-y-familias/')}">Leé la guía</a>.</p>
  <div class="grid g3" style="margin-top:18px">${familias.map((f) => { const n = plantas.filter((p) => p.familia === f.id); return `<a class="card" href="${href(`/familias/${f.id}/`)}"><span class="big">${f.emoji}</span><h3>${esc(f.nombre)}</h3><p><i>${esc(f.cientifico)}</i> · ${n.length} ${n.length === 1 ? 'planta' : 'plantas'}</p></a>`; }).join('')}</div></div>`,
}));
for (const f of familias) {
  const n = plantas.filter((p) => p.familia === f.id);
  write(`familias/${f.id}/index.html`, layout({
    title: `${f.nombre} (${f.cientifico})`, path: `/familias/${f.id}/`, active: '/familias/', desc: f.descripcion,
    body: `${crumbs([['/', 'Inicio'], ['/familias/', 'Familias'], [null, f.nombre]])}<div class="wrap" style="padding-top:20px">
    <div class="sheet-head" style="padding-top:10px"><span class="emoji">${f.emoji}</span><div><span class="tag">Familia botánica</span><h1>${esc(f.nombre)}</h1><p class="sci">${esc(f.cientifico)}</p></div></div>
    <div class="prose"><p style="font-size:1.1rem">${esc(f.descripcion)}</p><h2>Cómo reconocerla</h2>${list(f.rasgos)}<h2>Cuidados y rotación</h2><p>${esc(f.cuidado)}</p>
    <p><span class="chip">Grupo de rotación: ${esc(f.rotacion)}</span></p></div>
    <h2>Plantas de esta familia en ${NAME}</h2><div class="grid g4">${n.map(plantCard).join('') || '<p class="empty">Todavía no hay fichas de esta familia.</p>'}</div></div>`,
  }));
}

// Guías
write('guias/index.html', layout({
  title: 'Guías paso a paso', path: '/guias/', active: '/guias/',
  desc: 'Guías completas y sencillas: empezar, tamaños de huerta, suelo y compost, germinación, macetas, riego, multiplicación, plagas, frutales y más.',
  body: `${crumbs([['/', 'Inicio'], [null, 'Guías']])}<div class="wrap" style="padding-top:20px"><h1>Guías paso a paso</h1>
  <p class="prose" style="color:var(--ink-dim)">Todo lo que hay que saber, explicado simple. Empezá por la primera si recién arrancás.</p>${searchBox('Buscar en las guías…')}
  <div class="grid g2" style="margin-top:18px">${guias.map((g) => `<a class="card" href="${href(`/guias/${g.slug}/`)}"><span class="big">${g.meta.emoji}</span><h3>${esc(g.meta.title)}</h3><p>${esc(g.meta.resumen)}</p><p style="margin-top:8px;font-size:.8rem">⏱ ${Math.max(3, Math.round(g.body.split(/\s+/).length / 200))} min de lectura</p></a>`).join('')}</div></div>`,
}));
guias.forEach((g, i) => {
  const { html, toc } = renderMarkdown(g.body, { resolve });
  const prev = guias[i - 1], next = guias[i + 1];
  write(`guias/${g.slug}/index.html`, layout({
    title: g.meta.title, path: `/guias/${g.slug}/`, active: '/guias/', desc: g.meta.resumen,
    jsonld: { '@context': 'https://schema.org', '@type': 'Article', headline: g.meta.title, description: g.meta.resumen, inLanguage: 'es', dateModified: TODAY, publisher: { '@type': 'Organization', name: NAME } },
    body: `${crumbs([['/', 'Inicio'], ['/guias/', 'Guías'], [null, g.meta.title]])}
<div class="wrap guide-layout" style="padding-top:18px">
  <aside class="guide-side" aria-label="Guías">${guias.map((x) => `<a href="${href(`/guias/${x.slug}/`)}"${x.slug === g.slug ? ' aria-current="page"' : ''}>${x.meta.emoji} ${esc(x.meta.title.split(':')[0].split(' — ')[0])}</a>`).join('')}</aside>
  <article>
    <span class="tag">Guía</span><h1>${g.meta.emoji} ${esc(g.meta.title)}</h1><p class="prose" style="color:var(--ink-dim);font-size:1.1rem">${esc(g.meta.resumen)}</p>
    ${toc.length > 2 ? `<nav class="toc" aria-label="Contenido"><b>En esta guía</b><ol>${toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></nav>` : ''}
    <div class="prose">${html}</div>
    <div class="pager">${prev ? `<a class="btn btn-ghost" href="${href(`/guias/${prev.slug}/`)}">← ${esc(prev.meta.title.split(':')[0].split(' — ')[0])}</a>` : '<span></span>'}${next ? `<a class="btn btn-ghost" href="${href(`/guias/${next.slug}/`)}">${esc(next.meta.title.split(':')[0].split(' — ')[0])} →</a>` : ''}</div>
  </article>
</div>`,
  }));
});

// Calendario
write('calendario/index.html', layout({
  title: 'Calendario de siembra y cosecha', path: '/calendario/', active: '/calendario/',
  desc: 'Qué sembrar, trasplantar y cosechar cada mes, para hemisferio sur o norte y según tu zona. Matriz anual de todas las plantas.',
  body: `${crumbs([['/', 'Inicio'], [null, 'Calendario']])}<div class="wrap" style="padding-top:20px"><h1>Calendario de siembra y cosecha</h1>
  <p class="prose" style="color:var(--ink-dim)">Los datos base son para <b>hemisferio sur, clima templado con heladas</b> (ej.: Mendoza, Gran Buenos Aires, Córdoba). Elegí tu hemisferio y tu zona para ajustarlos. Es una guía orientativa: tu fecha local de heladas manda.</p>
  <h2>Qué hacer en un mes</h2><div class="now" data-widget="ahora" data-full></div>
  <h2>Todo el año de un vistazo</h2><div data-widget="matriz"></div></div>`,
}));

// Herramientas
write('herramientas/index.html', layout({
  title: 'Herramientas y calculadoras', path: '/herramientas/', active: '/herramientas/',
  desc: 'Calculadoras gratuitas para tu huerta: tamaño de macetas, cantidad de plantas por m² y fecha estimada de cosecha.',
  body: `${crumbs([['/', 'Inicio'], [null, 'Herramientas']])}<div class="wrap narrow" style="padding-top:20px"><h1>Herramientas</h1>
  <p class="prose" style="color:var(--ink-dim)">Cálculos rápidos para planificar. Son estimaciones: ajustalas con tu experiencia.</p>
  <section class="tool" id="maceta"><h2>🪴 Calculadora de macetas</h2><p>Elegí una planta y el volumen de tu maceta.</p><div data-tool="maceta"></div></section>
  <section class="tool" id="huerta"><h2>📏 Calculadora de huerta</h2><p>Cuántas plantas entran en tu cantero según las distancias recomendadas.</p><div data-tool="huerta"></div></section>
  <section class="tool" id="cosecha"><h2>🧺 Fecha estimada de cosecha</h2><p>Sumá los días típicos del cultivo a tu fecha de siembra.</p><div data-tool="cosecha"></div></section></div>`,
}));

// Glosario
const letters = {};
for (const g of glosario) { const l = g.termino[0].toUpperCase(); (letters[l] ??= []).push(g); }
write('glosario/index.html', layout({
  title: 'Glosario de jardinería y huerta', path: '/glosario/', active: '/glosario/',
  desc: 'Definiciones simples de los términos que vas a encontrar: acodo, almácigo, aporque, compost, injerto, pH, raleo y más.',
  body: `${crumbs([['/', 'Inicio'], [null, 'Glosario']])}<div class="wrap narrow" style="padding-top:20px"><h1>Glosario</h1>
  <div class="chips" style="margin:14px 0">${Object.keys(letters).sort().map((l) => `<a class="chip" href="#l-${l}">${l}</a>`).join('')}</div>
  <div class="prose">${Object.keys(letters).sort().map((l) => `<h2 id="l-${l}">${l}</h2><dl>${letters[l].map((g) => `<dt id="${slugify(g.termino)}" style="font-weight:700;margin-top:10px">${esc(g.termino)}</dt><dd style="margin-left:0">${esc(g.definicion)}</dd>`).join('')}</dl>`).join('')}</div></div>`,
}));

// Problemas
write('problemas/index.html', layout({
  title: 'Diagnóstico de problemas', path: '/problemas/', active: '',
  desc: 'Tabla de consulta rápida: síntomas frecuentes en la huerta, sus causas probables y qué hacer.',
  body: `${crumbs([['/', 'Inicio'], [null, 'Diagnóstico']])}<div class="wrap" style="padding-top:20px"><h1>Diagnóstico de problemas</h1>
  <p class="prose" style="color:var(--ink-dim)">Buscá el síntoma que ves. Para más detalle, leé la <a href="${href('/guias/problemas-comunes/')}">guía de problemas comunes</a>.</p>
  <div class="prose" style="max-width:none"><table><thead><tr><th>Síntoma</th><th>Causas probables</th><th>Qué hacer</th></tr></thead><tbody>${problemas.map((p) => `<tr><td><b>${esc(p.sintoma)}</b>${p.planta && plantById[p.planta] ? `<br><a class="chip" href="${href(`/plantas/${p.planta}/`)}">${plantById[p.planta].emoji} ${esc(plantById[p.planta].nombre)}</a>` : ''}</td><td>${esc(p.causas)}</td><td>${esc(p.solucion)}</td></tr>`).join('')}</tbody></table></div></div>`,
}));

// Acerca de
write('acerca/index.html', layout({
  title: `Acerca de ${NAME}`, path: '/acerca/', active: '',
  desc: `${NAME} es un manual libre y colaborativo de huertas, jardines, frutales y árboles. Conocé el proyecto y cómo colaborar.`,
  body: `${crumbs([['/', 'Inicio'], [null, 'Acerca de']])}<div class="wrap narrow" style="padding-top:20px"><h1>Acerca de ${NAME}</h1><div class="prose">
  <p>${NAME} nació con una idea simple: que cualquier persona, con un balcón o con una chacra, pueda aprender a cultivar sus plantas con información clara, honesta y gratuita.</p>
  <h2>Cómo está hecho</h2><p>Todo el contenido son archivos de texto abiertos (JSON y Markdown) que cualquiera puede leer y mejorar. El sitio se genera solo y funciona sin conexión una vez cargado.</p>
  <h2>Cómo colaborar</h2><ul><li>Corregí un dato o una fecha de tu zona.</li><li>Sumá una planta (copiá una ficha en <code>data/plantas/</code>).</li><li>Escribí o mejorá una guía en <code>content/guias/</code>.</li><li>Traducí el contenido a otro idioma.</li></ul>
  <p><a class="btn btn-primary" href="https://github.com/luquini0/HuertaUrbana">Ver el proyecto en GitHub</a></p>
  <h2>Importante</h2><blockquote class="ojo"><p>La información es orientativa y está pensada para clima templado del hemisferio sur por defecto. Cada huerta es distinta: observá, probá y adaptá. Ante dudas con plantas comestibles silvestres o tóxicas, consultá a un especialista.</p></blockquote>
  <h2>Licencias</h2><p>Contenido bajo <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.es">CC BY-SA 4.0</a>; código bajo licencia MIT.</p></div></div>`,
}));

// 404
write('404.html', layout({ title: 'No encontramos esa página', path: '/404.html', desc: 'La página que buscás no existe.', noindex: true,
  body: `<div class="wrap narrow" style="padding:80px 22px;text-align:center"><div style="font-size:4rem">🥀</div><h1>Esta planta no creció por acá</h1><p class="prose" style="margin:14px auto">No encontramos esa página. Probá buscando lo que necesitás:</p>${searchBox()}<p><a class="btn btn-primary" href="${href('/')}">Volver al inicio</a></p></div>` }));

// ---------- datos para el navegador ----------
write('data/plantas.json', JSON.stringify(plantas.map((p) => ({ id: p.id, n: p.nombre, e: p.emoji, t: p.tipo, est: p.estacion, a: p.meses.almacigo, d: p.meses.directa, tr: p.meses.trasplante, c: p.meses.cosecha, f: p.familia }))));
write('data/herramientas.json', JSON.stringify(plantas.map((p) => ({ id: p.id, n: p.nombre, e: p.emoji, l: p.maceta_litros, dp: p.distancia_cm.plantas, df: p.distancia_cm.filas, sem: !!p.germinacion_dias, cs: p.cosecha_dias, gs: p.germinacion_dias }))));
write('data/busqueda.json', JSON.stringify([
  ...plantas.map((p) => ({ t: p.nombre, k: [p.cientifico, ...(p.otros ?? []), p.grupo].join(' '), u: `/plantas/${p.id}/`, e: p.emoji, g: TIPOS[p.tipo].s })),
  ...guias.map((g) => ({ t: g.meta.title, k: g.meta.resumen, u: `/guias/${g.slug}/`, e: g.meta.emoji, g: 'Guía' })),
  ...familias.map((f) => ({ t: f.nombre, k: f.cientifico, u: `/familias/${f.id}/`, e: f.emoji, g: 'Familia' })),
  ...glosario.map((x) => ({ t: x.termino, k: x.definicion, u: `/glosario/#${slugify(x.termino)}`, e: '📖', g: 'Glosario' })),
]));
write('manifest.webmanifest', JSON.stringify({ name: NAME, short_name: NAME, description: 'Manual abierto de huertas, jardines y frutales', start_url: `${BASE}/`, scope: `${BASE}/`, display: 'standalone', background_color: '#f7f2e7', theme_color: '#3f7d4f', lang: 'es', icons: [{ src: `${BASE}/assets/logo.png`, sizes: 'any', type: 'image/png' }] }));
write('sw.js', `// Service worker de ${NAME}: funciona sin conexión tras la primera visita.
const CACHE = 'plantbook-${hash}';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(r);
    const net = fetch(r).then((res) => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
`);

// sitemap
const urls = written.filter((f) => f.endsWith('index.html')).map((f) => '/' + f.replace(/index\.html$/, ''));
const skip = new Set(['/problemas/']);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`);

console.log(`Plantbook: ${plantas.length} plantas · ${familias.length} familias · ${guias.length} guías · ${written.length} archivos → docs/`);
