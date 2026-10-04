// Mini renderizador de Markdown (sin dependencias) para las guías.
// Soporta: front matter, títulos, listas, tablas, citas/avisos, negrita, cursiva, código, enlaces, imágenes.

export function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function parseFrontMatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  return { meta, body: m[2] };
}

function inline(s, resolve) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${resolve(u)}">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return s;
}

export function renderMarkdown(body, { resolve = (u) => u } = {}) {
  const lines = body.replace(/\r/g, '').split('\n');
  const out = []; const toc = [];
  let i = 0;
  const para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(' '), resolve)}</p>`); para.length = 0; } };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { flush(); i++; continue; }

    let m;
    if ((m = line.match(/^(#{2,3})\s+(.*)$/))) {
      flush();
      const level = m[1].length; const text = m[2].trim(); const id = slugify(text);
      if (level === 2) toc.push({ id, text });
      out.push(`<h${level} id="${id}">${inline(text, resolve)}</h${level}>`); i++; continue;
    }
    if (/^---+$/.test(line.trim())) { flush(); out.push('<hr>'); i++; continue; }

    if (/^\s*[-*]\s+/.test(line)) {
      flush(); const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        let t = lines[i].replace(/^\s*[-*]\s+/, ''); i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) { t += ' ' + lines[i].trim(); i++; }
        items.push(`<li>${inline(t, resolve)}</li>`);
      }
      out.push(`<ul>${items.join('')}</ul>`); continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      flush(); const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        let t = lines[i].replace(/^\s*\d+\.\s+/, ''); i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i])) { t += ' ' + lines[i].trim(); i++; }
        items.push(`<li>${inline(t, resolve)}</li>`);
      }
      out.push(`<ol>${items.join('')}</ol>`); continue;
    }
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flush();
      const row = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = row(line); i += 2; const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(row(lines[i])); i++; }
      out.push('<table><thead><tr>' + head.map((c) => `<th>${inline(c, resolve)}</th>`).join('') + '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(c, resolve)}</td>`).join('') + '</tr>').join('') + '</tbody></table>');
      continue;
    }
    if (line.startsWith('>')) {
      flush(); const q = [];
      while (i < lines.length && lines[i].startsWith('>')) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
      let cls = ''; let label = '';
      const t = q[0].match(/^\[!(TIP|OJO|DATO)\]\s*(.*)$/);
      if (t) { cls = { TIP: '', OJO: 'ojo', DATO: 'dato' }[t[1]]; label = { TIP: 'Truco', OJO: 'Ojo', DATO: 'Dato' }[t[1]]; q[0] = t[2]; }
      const inner = q.join('\n').split(/\n\s*\n/).map((p) => `<p>${inline(p.replace(/\n/g, ' ').trim(), resolve)}</p>`).join('');
      out.push(`<blockquote${cls ? ` class="${cls}"` : ''}>${label ? `<strong class="cl">${label}</strong>` : ''}${inner}</blockquote>`);
      continue;
    }
    para.push(line.trim()); i++;
  }
  flush();
  return { html: out.join('\n'), toc };
}
