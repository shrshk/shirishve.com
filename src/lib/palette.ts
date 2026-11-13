// Source of truth for colour. src/styles/doodle.css mirrors these values.
// Run `npm run check:contrast` after any change here.

export const palette = {
  paper: '#F8F5EE',
  slip: '#FBF8F0',
  ink: '#3B2F2A',
  inkSoft: '#6B5A4E',
  thread: '#D9534A',
  crayonRed: '#C2413A',
  crayonBlue: '#3E3F9E',
  night: '#1B2040',
  chalk: '#F4F1EA',
  chalkWarm: '#E9C24A',
} as const;

export const AA_BODY = 4.5;
/** Large text (about 24 px and up, or 19 px bold) needs less. */
export const AA_LARGE = 3;

interface Pair {
  role: string;
  fg: string;
  bg: string;
  large?: boolean;
}

/** Every text colour with every surface it is drawn on. */
export const pairs: Pair[] = [
  { role: 'Body on paper', fg: palette.ink, bg: palette.paper },
  { role: 'Body on a note', fg: palette.ink, bg: palette.slip },
  { role: 'Soft text on paper', fg: palette.inkSoft, bg: palette.paper },
  { role: 'Soft text on a note', fg: palette.inkSoft, bg: palette.slip },
  { role: 'Links and labels on paper', fg: palette.crayonBlue, bg: palette.paper },
  { role: 'Links and labels on a note', fg: palette.crayonBlue, bg: palette.slip },
  { role: 'Headings on a note', fg: palette.crayonRed, bg: palette.slip, large: true },
  { role: 'Scene titles on paper', fg: palette.crayonRed, bg: palette.paper, large: true },
  { role: 'Chalk on the night', fg: palette.chalk, bg: palette.night },
  { role: 'Warm chalk on the night', fg: palette.chalkWarm, bg: palette.night },
];

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

export function contrastReport() {
  return pairs.map((p) => {
    const ratio = contrast(p.fg, p.bg);
    const need = p.large ? AA_LARGE : AA_BODY;
    return { ...p, ratio, need, pass: ratio >= need };
  });
}
