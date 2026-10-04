/* Huerta Urbana — comportamiento del navegador. Código bajo licencia MIT. Sin dependencias. */
(function () {
  'use strict';
  var BASE = document.documentElement.getAttribute('data-base') || '';
  var MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  var MESES_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var CAT = { almacigo: 'Almácigo', directa: 'Siembra directa', trasplante: 'Trasplante', cosecha: 'Cosecha' };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Estado compartido: hemisferio y zona ---------- */
  var state = {
    hemi: store('hu_hemi') || 's',
    zona: store('hu_zona') || 'templada'
  };
  function setState(k, v) { state[k] = v; store('hu_' + k, v); }

  // Los datos se guardan para hemisferio sur, clima templado con heladas invernales.
  function shift(months, plant) {
    var d = state.hemi === 'n' ? 6 : 0;
    var warm = plant.est === 'calida';
    var z = state.zona === 'fria' ? (warm ? 1 : -1) : state.zona === 'calida' ? (warm ? -1 : 1) : 0;
    if (plant.est === 'perenne') z = 0;
    return (months || []).map(function (m) { return ((m - 1 + d + z + 120) % 12) + 1; });
  }
  function calendar(plant) {
    return {
      almacigo: shift(plant.a, plant), directa: shift(plant.d, plant),
      trasplante: shift(plant.tr, plant), cosecha: shift(plant.c, plant)
    };
  }

  /* ---------- Datos ---------- */
  var dataPromise = null;
  function loadData() {
    if (!dataPromise) dataPromise = fetch(BASE + '/data/plantas.json').then(function (r) { return r.json(); });
    return dataPromise;
  }

  /* ---------- Cabecera: menú y tema ---------- */
  var menuBtn = $('.menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var nav = $('nav.main'); var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  var themeBtn = $('#theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    var next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next); store('hu_theme', next);
  });

  /* ---------- Búsqueda ---------- */
  var searchInputs = $$('[data-search]');
  var searchIndex = null;
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  searchInputs.forEach(function (input) {
    var box = document.createElement('div'); box.className = 'results'; box.hidden = true;
    input.parentNode.appendChild(box);
    input.addEventListener('focus', function () {
      if (!searchIndex) searchIndex = fetch(BASE + '/data/busqueda.json').then(function (r) { return r.json(); });
    });
    input.addEventListener('input', function () {
      var q = norm(input.value.trim());
      if (q.length < 2) { box.hidden = true; return; }
      (searchIndex || (searchIndex = fetch(BASE + '/data/busqueda.json').then(function (r) { return r.json(); }))).then(function (idx) {
        var res = idx.map(function (it) {
          var t = norm(it.t), k = norm(it.k || '');
          var s = t.indexOf(q) === 0 ? 3 : t.indexOf(q) > -1 ? 2 : k.indexOf(q) > -1 ? 1 : 0;
          return { it: it, s: s };
        }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
        box.innerHTML = res.length ? res.map(function (x) {
          return '<a href="' + BASE + x.it.u + '"><span>' + (x.it.e || '📖') + '</span><span>' + esc(x.it.t) + '</span><small>' + esc(x.it.g) + '</small></a>';
        }).join('') : '<a href="#" onclick="return false"><span>🔎</span><span>Sin resultados — probá con otra palabra</span></a>';
        box.hidden = false;
      });
    });
    document.addEventListener('click', function (e) { if (!input.parentNode.contains(e.target)) box.hidden = true; });
  });

  /* ---------- Selectores de hemisferio / zona ---------- */
  function controlsHTML(opts) {
    var h = '<div class="controls">';
    h += '<div><div class="tag" style="margin-bottom:4px">Hemisferio</div><div class="seg" role="group" aria-label="Hemisferio">' +
      '<button type="button" data-hemi="s" aria-pressed="' + (state.hemi === 's') + '">Sur</button>' +
      '<button type="button" data-hemi="n" aria-pressed="' + (state.hemi === 'n') + '">Norte</button></div></div>';
    h += '<label>Zona<select data-zona><option value="fria">Fría (heladas largas)</option><option value="templada">Templada</option><option value="calida">Cálida (sin heladas)</option></select></label>';
    if (opts.mes) {
      h += '<label>Mes<select data-mes>' + MESES_L.map(function (m, i) { return '<option value="' + (i + 1) + '">' + m + '</option>'; }).join('') + '</select></label>';
    }
    if (opts.tipo) {
      h += '<label>Qué cultivo<select data-tipo><option value="">Todo</option><option value="hortaliza">Hortalizas</option><option value="aromatica">Aromáticas</option><option value="flor">Flores</option><option value="frutal">Frutales</option><option value="arbol">Árboles</option></select></label>';
    }
    return h + '</div>';
  }
  function bindControls(root, rerender) {
    $$('[data-hemi]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        setState('hemi', b.getAttribute('data-hemi'));
        $$('[data-hemi]', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        rerender();
      });
    });
    var z = $('[data-zona]', root); if (z) { z.value = state.zona; z.addEventListener('change', function () { setState('zona', z.value); rerender(); }); }
    ['mes', 'tipo'].forEach(function (n) { var el = $('[data-' + n + ']', root); if (el) el.addEventListener('change', rerender); });
  }

  /* ---------- Widget: qué hago este mes ---------- */
  function widgetAhora(root) {
    var full = root.hasAttribute('data-full');
    root.innerHTML = controlsHTML({ mes: true, tipo: full }) + '<div class="lanes" aria-live="polite"></div>';
    var mesSel = $('[data-mes]', root); mesSel.value = new Date().getMonth() + 1;
    var lanes = $('.lanes', root);
    loadData().then(function (plants) {
      function render() {
        var mes = +mesSel.value; var tipo = ($('[data-tipo]', root) || {}).value || '';
        var cols = [['almacigo', 'Sembrar en almácigo'], ['directa', 'Sembrar directo'], ['trasplante', 'Trasplantar'], ['cosecha', 'Cosechar']];
        lanes.innerHTML = cols.map(function (c) {
          var items = plants.filter(function (p) {
            return (!tipo || p.t === tipo) && calendar(p)[c[0]].indexOf(mes) > -1;
          });
          var chips = items.map(function (p) { return '<a class="chip" href="' + BASE + '/plantas/' + p.id + '/">' + p.e + ' ' + esc(p.n) + '</a>'; }).join('');
          return '<div class="lane"><h3><span class="dot ' + c[0] + '"></span>' + c[1] + ' <small style="font-weight:400;color:var(--ink-dim)">(' + items.length + ')</small></h3>' +
            (chips ? '<div class="chips">' + chips + '</div>' : '<p class="empty">Nada para este mes con estos filtros.</p>') + '</div>';
        }).join('');
      }
      bindControls(root, render); render();
    });
  }

  /* ---------- Widget: matriz anual ---------- */
  function widgetMatriz(root) {
    root.innerHTML = controlsHTML({ tipo: true }) +
      '<div class="legend"><span><i class="dot almacigo"></i>Almácigo</span><span><i class="dot directa"></i>Siembra directa</span><span><i class="dot trasplante"></i>Trasplante</span><span><i class="dot cosecha"></i>Cosecha</span></div>' +
      '<div class="matrix-wrap"><table class="matrix"></table></div>';
    var table = $('table', root);
    loadData().then(function (plants) {
      function render() {
        var tipo = $('[data-tipo]', root).value;
        var head = '<thead><tr><th>Planta</th>' + MESES.map(function (m) { return '<th>' + m + '</th>'; }).join('') + '</tr></thead>';
        var rows = plants.filter(function (p) { return !tipo || p.t === tipo; }).map(function (p) {
          var cal = calendar(p);
          var cells = '';
          for (var m = 1; m <= 12; m++) {
            var s = cal.directa.indexOf(m) > -1, a = cal.almacigo.indexOf(m) > -1, t = cal.trasplante.indexOf(m) > -1, c = cal.cosecha.indexOf(m) > -1;
            var cls = (s || a || t) && c ? 'i-dc' : c ? 'i-c' : a ? 'i-a' : t ? 'i-t' : s ? 'i-d' : '';
            var label = [a && 'almácigo', s && 'siembra directa', t && 'trasplante', c && 'cosecha'].filter(Boolean).join(', ');
            cells += '<td>' + (cls ? '<i class="' + cls + '" title="' + MESES_L[m - 1] + ': ' + label + '"></i>' : '') + '</td>';
          }
          return '<tr><td><a href="' + BASE + '/plantas/' + p.id + '/">' + p.e + ' ' + esc(p.n) + '</a></td>' + cells + '</tr>';
        }).join('');
        table.innerHTML = head + '<tbody>' + rows + '</tbody>';
      }
      bindControls(root, render); render();
    });
  }

  /* ---------- Franja anual en la ficha de cada planta ---------- */
  function widgetStrip(root) {
    var p = JSON.parse(root.getAttribute('data-plant'));
    var host = $('.strip-host', root);
    root.insertAdjacentHTML('afterbegin', controlsHTML({}));
    function render() {
      var cal = calendar(p);
      var html = '<div class="strip" role="img" aria-label="Calendario anual de ' + esc(p.n) + '">';
      for (var m = 1; m <= 12; m++) {
        var a = cal.almacigo.indexOf(m) > -1, d = cal.directa.indexOf(m) > -1, t = cal.trasplante.indexOf(m) > -1, c = cal.cosecha.indexOf(m) > -1;
        var cls = (a || d || t) && c ? 'multi' : c ? 'm-c' : a ? 'm-a' : t ? 'm-t' : d ? 'm-d' : '';
        var tags = (a ? 'A ' : '') + (d ? 'S ' : '') + (t ? 'T ' : '') + (c ? 'C' : '');
        html += '<div class="' + cls + '" title="' + MESES_L[m - 1] + '"><b>' + MESES[m - 1] + '</b><span>' + tags + '</span></div>';
      }
      host.innerHTML = html + '</div>';
    }
    bindControls(root, render); render();
  }

  /* ---------- Filtros del listado de plantas ---------- */
  function widgetFiltroPlantas(root) {
    var cards = $$('[data-card]', root);
    var q = $('[data-q]', root), tipo = '', sol = '', dif = '', maceta = false;
    function apply() {
      var t = norm(q.value || '');
      var shown = 0;
      cards.forEach(function (c) {
        var ok = (!tipo || c.dataset.tipo === tipo) && (!sol || c.dataset.sol === sol) && (!dif || c.dataset.dif === dif) &&
          (!maceta || c.dataset.maceta === '1') && (!t || norm(c.dataset.k).indexOf(t) > -1);
        c.hidden = !ok; if (ok) shown++;
      });
      var cnt = $('[data-count]', root); if (cnt) cnt.textContent = shown + (shown === 1 ? ' planta' : ' plantas');
    }
    q.addEventListener('input', apply);
    $$('[data-filter]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var kind = b.dataset.filter, val = b.dataset.value;
        var on = b.getAttribute('aria-pressed') !== 'true';
        $$('[data-filter="' + kind + '"]', root).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', on);
        if (kind === 'tipo') tipo = on ? val : ''; if (kind === 'sol') sol = on ? val : '';
        if (kind === 'dif') dif = on ? val : ''; if (kind === 'maceta') maceta = on;
        apply();
      });
    });
    var pre = new URLSearchParams(location.search).get('tipo');
    if (pre) { var b = $('[data-filter="tipo"][data-value="' + pre + '"]', root); if (b) b.click(); }
    apply();
  }

  /* ---------- Herramientas ---------- */
  var plantsByIdPromise = null;
  function byId() {
    if (!plantsByIdPromise) plantsByIdPromise = fetch(BASE + '/data/herramientas.json').then(function (r) { return r.json(); });
    return plantsByIdPromise;
  }
  function plantSelect(list, filterFn) {
    return '<select data-plant-select>' + list.filter(filterFn || function () { return true; }).map(function (p) {
      return '<option value="' + p.id + '">' + p.e + ' ' + esc(p.n) + '</option>';
    }).join('') + '</select>';
  }

  function toolMaceta(root) {
    byId().then(function (list) {
      root.innerHTML = '<div class="row"><label>Planta' + plantSelect(list, function (p) { return p.l; }) + '</label>' +
        '<label>Tu maceta (litros)<input type="number" min="1" step="1" value="20" data-litros></label></div><div class="out" data-out></div>';
      function calc() {
        var p = list.filter(function (x) { return x.id === $('[data-plant-select]', root).value; })[0];
        var L = +$('[data-litros]', root).value || 0; var out = $('[data-out]', root);
        var per = p.l; var n = Math.floor(L / per);
        out.innerHTML = n >= 1
          ? '<b>Entran ' + n + (n === 1 ? ' planta' : ' plantas') + '</b> de ' + esc(p.n) + ' en ' + L + ' litros (necesita ~' + per + ' L por planta). Una maceta de ' + L + ' L suele medir unos ' + Math.round(Math.cbrt(L * 1000) * 1.15) + ' cm de diámetro por ' + Math.round(Math.cbrt(L * 1000) * 1.05) + ' cm de alto.'
          : '<b>Queda chica.</b> ' + esc(p.n) + ' necesita al menos ' + per + ' litros por planta. Probá con una maceta más grande.';
      }
      $$('input,select', root).forEach(function (e) { e.addEventListener('input', calc); });
      calc();
    });
  }

  function toolHuerta(root) {
    byId().then(function (list) {
      root.innerHTML = '<div class="row"><label>Planta' + plantSelect(list, function (p) { return p.dp; }) + '</label>' +
        '<label>Superficie (m²)<input type="number" min="0.1" step="0.1" value="4" data-m2></label>' +
        '<label>Camino (% del terreno)<input type="number" min="0" max="60" step="5" value="25" data-camino></label></div><div class="out" data-out></div>';
      function calc() {
        var p = list.filter(function (x) { return x.id === $('[data-plant-select]', root).value; })[0];
        var m2 = +$('[data-m2]', root).value || 0, cam = +$('[data-camino]', root).value || 0;
        var util = m2 * (1 - cam / 100);
        var per = (p.dp * p.df) / 10000; var n = Math.floor(util / per);
        $('[data-out]', root).innerHTML = '<b>Unas ' + n + ' plantas</b> de ' + esc(p.n) + ' en ' + util.toFixed(1) + ' m² cultivables (' + p.dp + ' cm entre plantas × ' + p.df + ' cm entre filas).' +
          (p.sem ? ' Para eso necesitás aprox. ' + Math.ceil(n * 1.3) + ' semillas (con 30 % de margen por fallas).' : '');
      }
      $$('input,select', root).forEach(function (e) { e.addEventListener('input', calc); });
      calc();
    });
  }

  function toolCosecha(root) {
    byId().then(function (list) {
      var today = new Date().toISOString().slice(0, 10);
      root.innerHTML = '<div class="row"><label>Planta' + plantSelect(list, function (p) { return p.cs; }) + '</label>' +
        '<label>Fecha de siembra o trasplante<input type="date" value="' + today + '" data-fecha></label>' +
        '<label>¿Desde cuándo cuentan los días?<select data-desde><option value="g">Desde la siembra</option><option value="t">Desde el trasplante</option></select></label></div><div class="out" data-out></div>';
      function fmt(d) { return d.getDate() + ' de ' + MESES_L[d.getMonth()].toLowerCase() + ' de ' + d.getFullYear(); }
      function calc() {
        var p = list.filter(function (x) { return x.id === $('[data-plant-select]', root).value; })[0];
        var f = new Date($('[data-fecha]', root).value + 'T12:00:00'); if (isNaN(f)) return;
        var germ = $('[data-desde]', root).value === 'g';
        var a = new Date(f.getTime() + p.cs[0] * 864e5), b = new Date(f.getTime() + p.cs[1] * 864e5);
        $('[data-out]', root).innerHTML = '<b>' + esc(p.n) + '</b>: cosecha estimada entre el <b>' + fmt(a) + '</b> y el <b>' + fmt(b) + '</b>. ' +
          (p.gs ? 'La germinación tarda unos ' + p.gs[0] + '–' + p.gs[1] + ' días.' : '') +
          ' <br><small>Es una estimación: el clima, la variedad y el cuidado cambian los tiempos.</small>';
      }
      $$('input,select', root).forEach(function (e) { e.addEventListener('input', calc); });
      calc();
    });
  }

  /* ---------- Arranque ---------- */
  $$('[data-widget="ahora"]').forEach(widgetAhora);
  $$('[data-widget="matriz"]').forEach(widgetMatriz);
  $$('[data-widget="strip"]').forEach(widgetStrip);
  $$('[data-widget="filtro-plantas"]').forEach(widgetFiltroPlantas);
  $$('[data-tool="maceta"]').forEach(toolMaceta);
  $$('[data-tool="huerta"]').forEach(toolHuerta);
  $$('[data-tool="cosecha"]').forEach(toolCosecha);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register(BASE + '/sw.js').catch(function () {});
  }
})();
