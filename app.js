(function () {
  'use strict';

  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Roughly follows real English letter-frequency ranking: common letters get
  // several interchangeable symbols (homophones), rare letters get just one.
  var HOMOPHONE_COUNTS = {
    E: 7, T: 6, A: 6, O: 5, I: 5, N: 5, S: 4, H: 4, R: 3, D: 3,
    L: 2, C: 2, U: 2, M: 2, W: 2,
    F: 1, G: 1, Y: 1, P: 1, B: 1, V: 1, K: 1, J: 1, X: 1, Q: 1, Z: 1
  };

  var TOTAL_SYMBOLS = LETTERS.reduce(function (sum, l) { return sum + HOMOPHONE_COUNTS[l]; }, 0);

  // ---------- Procedural glyph generation ----------
  // Each glyph is one of a handful of base strokes, rotated and weighted
  // differently so the ~70 needed symbols all read as distinct hand-drawn marks.
  var BASE_SHAPES = [
    function circle(s) { return '<circle cx="12" cy="12" r="8" stroke-width="' + s + '"/>'; },
    function circleDot(s) { return '<circle cx="12" cy="12" r="8" stroke-width="' + s + '"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>'; },
    function arc(s) { return '<path d="M4 14 A8 8 0 0 1 20 14" stroke-width="' + s + '"/>'; },
    function triangle(s) { return '<path d="M12 3 L21 20 L3 20 Z" stroke-width="' + s + '"/>'; },
    function square(s) { return '<rect x="4" y="4" width="16" height="16" stroke-width="' + s + '"/>'; },
    function squareX(s) { return '<rect x="4" y="4" width="16" height="16" stroke-width="' + s + '"/><path d="M4 4 L20 20 M20 4 L4 20" stroke-width="' + s + '"/>'; },
    function diamond(s) { return '<path d="M12 2 L22 12 L12 22 L2 12 Z" stroke-width="' + s + '"/>'; },
    function plus(s) { return '<path d="M12 3 V21 M3 12 H21" stroke-width="' + s + '"/>'; },
    function cross(s) { return '<path d="M5 5 L19 19 M19 5 L5 19" stroke-width="' + s + '"/>'; },
    function lineDot(s) { return '<path d="M3 12 H21" stroke-width="' + s + '"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>'; },
    function zigzag(s) { return '<path d="M3 6 L12 18 L21 6" stroke-width="' + s + '"/>'; },
    function arrow(s) { return '<path d="M3 12 H19 M13 6 L19 12 L13 18" stroke-width="' + s + '"/>'; },
    function hook(s) { return '<path d="M6 3 V15 A6 6 0 0 0 18 15" stroke-width="' + s + '"/>'; },
    function parallel(s) { return '<path d="M7 3 V21 M17 3 V21" stroke-width="' + s + '"/>'; },
    function circleSlash(s) { return '<circle cx="12" cy="12" r="8" stroke-width="' + s + '"/><path d="M6 6 L18 18" stroke-width="' + s + '"/>'; },
    function squareDot(s) { return '<rect x="5" y="5" width="14" height="14" stroke-width="' + s + '"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>'; },
    function triCircle(s) { return '<circle cx="12" cy="12" r="9" stroke-width="' + s + '"/><path d="M12 6 L17 16 L7 16 Z" stroke-width="' + s + '"/>'; },
    function chevronDouble(s) { return '<path d="M4 8 L12 15 L20 8 M4 15 L12 20" stroke-width="' + s + '"/>'; },
    function tee(s) { return '<path d="M4 6 H20 M12 6 V20" stroke-width="' + s + '"/>'; },
    function bracket(s) { return '<path d="M17 4 H7 V20 H17" stroke-width="' + s + '"/>'; }
  ];
  var ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315];
  var STROKE_WEIGHTS = [1.4, 2];

  function buildGlyphSet(count) {
    var glyphs = [];
    for (var i = 0; i < count; i++) {
      var shapeFn = BASE_SHAPES[i % BASE_SHAPES.length];
      var rotIndex = Math.floor(i / BASE_SHAPES.length) % ROTATIONS.length;
      var weight = STROKE_WEIGHTS[Math.floor(i / (BASE_SHAPES.length * ROTATIONS.length)) % STROKE_WEIGHTS.length];
      var rotation = ROTATIONS[rotIndex];
      var inner = shapeFn(weight);
      var svg = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
        '<g transform="rotate(' + rotation + ' 12 12)">' + inner + '</g></svg>';
      glyphs.push(svg);
    }
    return glyphs;
  }

  var GLYPH_SVGS = buildGlyphSet(Math.max(TOTAL_SYMBOLS, BASE_SHAPES.length * ROTATIONS.length));

  // ---------- Key generation ----------
  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  var cipherKey = {}; // letter -> array of glyph indices

  function generateKey() {
    var pool = shuffled(GLYPH_SVGS.map(function (_, i) { return i; }));
    var cursor = 0;
    cipherKey = {};
    LETTERS.forEach(function (letter) {
      var n = HOMOPHONE_COUNTS[letter];
      cipherKey[letter] = pool.slice(cursor, cursor + n);
      cursor += n;
    });
  }

  function pickSymbolFor(letter) {
    var options = cipherKey[letter];
    return options[Math.floor(Math.random() * options.length)];
  }

  // ---------- Encoding ----------
  function encode(text, hideSpaces) {
    var upper = text.toUpperCase();
    var tokens = [];
    for (var i = 0; i < upper.length; i++) {
      var ch = upper[i];
      if (/[A-Z]/.test(ch)) {
        tokens.push({ type: 'letter', letter: ch, glyphIndex: pickSymbolFor(ch) });
      } else if (ch === ' ') {
        if (!hideSpaces) tokens.push({ type: 'space' });
      } else if (/\S/.test(ch)) {
        tokens.push({ type: 'literal', char: ch });
      }
    }
    return tokens;
  }

  // ---------- Rendering ----------
  function renderCipher(tokens, revealKey) {
    var out = document.getElementById('cipherOutput');
    out.innerHTML = '';
    tokens.forEach(function (t) {
      var wrap = document.createElement('span');
      if (t.type === 'space') {
        wrap.className = 'glyph space';
      } else if (t.type === 'literal') {
        wrap.className = 'glyph literal';
        var lit = document.createElement('span');
        lit.className = 'lit-char';
        lit.textContent = t.char;
        wrap.appendChild(lit);
        var tag = document.createElement('span');
        tag.className = 'letter-tag';
        wrap.appendChild(tag);
      } else {
        wrap.className = 'glyph';
        wrap.innerHTML = GLYPH_SVGS[t.glyphIndex];
        var tag2 = document.createElement('span');
        tag2.className = 'letter-tag';
        tag2.textContent = revealKey ? t.letter : '';
        wrap.appendChild(tag2);
      }
      out.appendChild(wrap);
    });
  }

  function renderKeyTable() {
    var table = document.getElementById('keyTable');
    table.innerHTML = '';
    LETTERS.forEach(function (letter) {
      var row = document.createElement('div');
      row.className = 'key-row';
      var letterEl = document.createElement('div');
      letterEl.className = 'letter';
      letterEl.textContent = letter;
      var glyphsEl = document.createElement('div');
      glyphsEl.className = 'glyphs';
      cipherKey[letter].forEach(function (idx) {
        var s = document.createElement('span');
        s.innerHTML = GLYPH_SVGS[idx];
        glyphsEl.appendChild(s);
      });
      row.appendChild(letterEl);
      row.appendChild(glyphsEl);
      table.appendChild(row);
    });
    document.getElementById('countE').textContent = HOMOPHONE_COUNTS.E;
    document.getElementById('countZ').textContent = HOMOPHONE_COUNTS.Z;
  }

  function renderChart(containerId, entries) {
    var container = document.getElementById(containerId);
    container.innerHTML = '';
    if (!entries.length) return;
    var max = Math.max.apply(null, entries.map(function (e) { return e.count; }));
    var topCount = entries[0] ? entries[0].count : 0;
    entries.forEach(function (e) {
      var col = document.createElement('div');
      col.className = 'bar-col' + (e.count === topCount ? ' top' : '');
      var bar = document.createElement('div');
      bar.className = 'bar';
      var pct = max > 0 ? (e.count / max) * 100 : 0;
      bar.style.height = Math.max(pct, 3) + '%';
      bar.title = e.label + ': ' + e.count;
      var label = document.createElement('div');
      label.className = 'bar-label';
      label.textContent = e.label;
      col.appendChild(bar);
      col.appendChild(label);
      container.appendChild(col);
    });
  }

  function computeLetterFrequency(text) {
    var counts = {};
    var upper = text.toUpperCase();
    for (var i = 0; i < upper.length; i++) {
      var ch = upper[i];
      if (/[A-Z]/.test(ch)) counts[ch] = (counts[ch] || 0) + 1;
    }
    return Object.keys(counts)
      .map(function (l) { return { label: l, count: counts[l] }; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  function computeSymbolFrequency(tokens) {
    var counts = {};
    tokens.forEach(function (t) {
      if (t.type === 'letter') counts[t.glyphIndex] = (counts[t.glyphIndex] || 0) + 1;
    });
    return Object.keys(counts)
      .map(function (idx, i) { return { label: '#' + (i + 1), count: counts[idx] }; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  // ---------- Wiring ----------
  var textarea = document.getElementById('plaintext');
  var hideSpacesBox = document.getElementById('hideSpaces');
  var revealKeyBox = document.getElementById('revealKey');
  var newKeyBtn = document.getElementById('newKeyBtn');

  var lastTokens = [];

  function update() {
    var text = textarea.value;
    lastTokens = encode(text, hideSpacesBox.checked);
    renderCipher(lastTokens, revealKeyBox.checked);
    renderChart('plainChart', computeLetterFrequency(text));
    renderChart('cipherChart', computeSymbolFrequency(lastTokens));
  }

  function regenerateKeyAndUpdate() {
    generateKey();
    renderKeyTable();
    update();
  }

  textarea.addEventListener('input', update);
  hideSpacesBox.addEventListener('change', update);
  revealKeyBox.addEventListener('change', function () {
    renderCipher(lastTokens, revealKeyBox.checked);
  });
  newKeyBtn.addEventListener('click', regenerateKeyAndUpdate);

  regenerateKeyAndUpdate();
})();
