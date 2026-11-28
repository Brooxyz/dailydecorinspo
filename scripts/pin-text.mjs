// Pin typography = website typography. sharp's SVG text renderer on Windows only sees system-installed
// fonts (it ignored both fontconfig files and `fontfile`), so text is shaped and converted to vector
// paths here with fontkit from the site's fonts in scripts/fonts/ (Fraunces 500, Instrument Sans 500/600;
// SIL OFL static instances from Google Fonts). Same output on any machine.
import path from 'path';
import { fileURLToPath } from 'url';
import * as fontkit from 'fontkit';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts');
export const FONTS = {
  display: fontkit.openSync(path.join(DIR, 'Fraunces-500.woff')),
  sans: fontkit.openSync(path.join(DIR, 'InstrumentSans-500.woff')),
  sansBold: fontkit.openSync(path.join(DIR, 'InstrumentSans-600.woff')),
};

const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export function measure(str, font = 'sans', size = 20) {
  const f = FONTS[font];
  return (f.layout(String(str)).advanceWidth * size) / f.unitsPerEm;
}

/** One line of text as SVG paths. anchor: start | middle | end. Shrinks to fit maxWidth. */
export function text(str, { font = 'sans', size = 20, x = 0, y = 0, anchor = 'start', fill = '#2b1d14', maxWidth } = {}) {
  const f = FONTS[font];
  let s = size;
  if (maxWidth) while (measure(str, font, s) > maxWidth && s > 8) s -= 1;
  const run = f.layout(String(str));
  const scale = s / f.unitsPerEm;
  const w = run.advanceWidth * scale;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  let cx = 0;
  const parts = [];
  run.glyphs.forEach((g, i) => {
    const p = run.positions[i];
    const d = g.path.toSVG();
    if (d) {
      parts.push(
        `<path transform="translate(${(x0 + (cx + p.xOffset) * scale).toFixed(2)} ${(y - p.yOffset * scale).toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})" d="${d}"/>`
      );
    }
    cx += p.xAdvance;
  });
  return `<g fill="${esc(fill)}">${parts.join('')}</g>`;
}

/** Greedy word wrap by real glyph widths; the last kept line gets "..." if text is cut. */
export function wrap(str, { font = 'sans', size = 20, maxWidth = 800, maxLines = 3 } = {}) {
  const words = String(str).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (measure(next, font, size) > maxWidth && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] + '...';
  while (measure(last, font, size) > maxWidth && last.length > 4) last = last.slice(0, -4).trimEnd() + '...';
  kept[maxLines - 1] = last;
  return kept;
}
