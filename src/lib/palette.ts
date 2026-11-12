// Source of truth for colour. tokens.css mirrors these values.
// Run `npm run check:contrast` after any change here.

export const palette = {
  night: '#101B3B',
  cobalt: '#1F4E8C',
  sky: '#4F86C6',
  chrome: '#F2C230',
  ochre: '#C98A1B',
  cypress: '#23402B',
  blossom: '#7DBDB4',
  canvas: '#F3E9CF',
  vermilion: '#E0201B',
} as const;

export type Token = keyof typeof palette;

export const roles: Record<Token, string> = {
  night: 'Hero sky, footer, dark surfaces',
  cobalt: 'Swirl strokes, links on light surfaces',
  sky: 'Lighter swirl strokes, hover states',
  chrome: 'Stars, headings on dark, primary buttons',
  ochre: 'Wheat, borders, frame edges',
  cypress: 'Deep green shapes and dividers',
  blossom: 'Tags, secondary accents',
  canvas: 'Light surfaces and body background',
  vermilion: 'Arsenal accent: one use per screen',
};

export interface StrokeSpec {
  color: string;
  opacity: number;
  /** Relative share of the strokes in a field. */
  weight: number;
}

export interface Surface {
  label: string;
  base: string;
  strokes: StrokeSpec[];
  /** Text colours allowed on this surface. Every one must pass AA on base and strokes. */
  text: { body: string; heading: string; link: string; muted: string };
  /** Base direction of the brushwork in radians, and how much it swirls. */
  angle: number;
  swirl: number;
}

export const surfaces = {
  night: {
    label: 'Night sky',
    base: palette.night,
    strokes: [
      { color: '#0A1230', opacity: 0.7, weight: 3 },
      { color: palette.cobalt, opacity: 0.5, weight: 4 },
      { color: '#2A5FA3', opacity: 0.26, weight: 2 },
      { color: palette.sky, opacity: 0.12, weight: 1 },
    ],
    text: { body: palette.canvas, heading: palette.chrome, link: '#A9C9EE', muted: '#D2CBB4' },
    angle: -0.25,
    swirl: 1.5,
  },
  canvas: {
    label: 'Sunlit room',
    base: palette.canvas,
    strokes: [
      { color: '#FBF4DF', opacity: 0.75, weight: 3 },
      { color: '#E8D9AE', opacity: 0.65, weight: 3 },
      { color: '#DCC98F', opacity: 0.3, weight: 2 },
      { color: palette.blossom, opacity: 0.14, weight: 1 },
      { color: palette.chrome, opacity: 0.16, weight: 1 },
    ],
    text: { body: palette.night, heading: palette.night, link: palette.cobalt, muted: '#4A4636' },
    angle: 0.5,
    swirl: 0.5,
  },
  wheat: {
    label: 'Wheatfield at noon',
    base: '#EDBB2E',
    strokes: [
      { color: palette.ochre, opacity: 0.45, weight: 3 },
      { color: '#F8D968', opacity: 0.65, weight: 3 },
      { color: '#DFA422', opacity: 0.5, weight: 2 },
      { color: palette.canvas, opacity: 0.22, weight: 1 },
    ],
    text: { body: palette.night, heading: palette.night, link: '#12305C', muted: '#33290C' },
    angle: -1.25,
    swirl: 0.35,
  },
  cypress: {
    label: 'Cypress shade',
    base: palette.cypress,
    strokes: [
      { color: '#172C1D', opacity: 0.7, weight: 3 },
      { color: '#2E5438', opacity: 0.55, weight: 3 },
      { color: '#3C6B47', opacity: 0.28, weight: 2 },
      { color: palette.blossom, opacity: 0.08, weight: 1 },
    ],
    text: { body: palette.canvas, heading: palette.chrome, link: '#A8DDD5', muted: '#D2CBB4' },
    angle: -1.5,
    swirl: 0.6,
  },
  wall: {
    label: 'Gallery wall',
    base: '#74B3AA',
    strokes: [
      { color: palette.blossom, opacity: 0.7, weight: 3 },
      { color: '#64A39A', opacity: 0.55, weight: 3 },
      { color: '#93CFC6', opacity: 0.4, weight: 2 },
      { color: palette.chrome, opacity: 0.1, weight: 1 },
    ],
    text: { body: palette.night, heading: palette.night, link: '#12305C', muted: '#1F2D2B' },
    angle: 0.15,
    swirl: 0.3,
  },
  terrace: {
    label: 'Terrace at evening',
    base: '#1E3A78',
    strokes: [
      { color: '#152B5E', opacity: 0.7, weight: 3 },
      { color: '#2A5FA3', opacity: 0.35, weight: 3 },
      { color: '#3A72B5', opacity: 0.14, weight: 2 },
      { color: palette.chrome, opacity: 0.07, weight: 1 },
    ],
    text: { body: palette.canvas, heading: palette.chrome, link: '#B9D4F2', muted: '#DAD3BC' },
    angle: 1.2,
    swirl: 0.5,
  },
} satisfies Record<string, Surface>;

export type SurfaceName = keyof typeof surfaces;

/** Text that sits on painted components instead of a surface. `darken` is the worst-case impasto shading. */
export const componentPairs = [
  { name: 'Button (primary)', fg: palette.night, bg: palette.chrome, darken: 0.3 },
  { name: 'Tag', fg: palette.night, bg: palette.blossom, darken: 0.15 },
  { name: 'Frame plate', fg: palette.night, bg: '#E7D9A9', darken: 0.2 },
  { name: 'Frame canvas', fg: palette.night, bg: palette.canvas, darken: 0 },
  { name: 'Nav strip', fg: palette.night, bg: palette.canvas, darken: 0.2 },
  { name: 'Letter and napkin', fg: palette.night, bg: '#F7EFD9', darken: 0.2 },
  { name: 'Slate chalk', fg: '#F7EFD9', bg: palette.night, darken: 0 },
  { name: 'Letter link', fg: palette.cobalt, bg: '#F7EFD9', darken: 0.2 },
  { name: 'Pitch label', fg: palette.canvas, bg: palette.cypress, darken: 0 },
  // Hero: behind the text the moving sky paints only its dark blues; cobalt is the lightest.
  { name: 'Hero text on sky', fg: palette.canvas, bg: palette.cobalt, darken: 0 },
  { name: 'Hero name on sky', fg: palette.chrome, bg: palette.cobalt, darken: 0 },
  { name: 'Hero muted on sky', fg: '#D2CBB4', bg: palette.cobalt, darken: 0 },
];

// --- colour maths ---

type RGB = [number, number, number];

export function toRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/** `fg` painted over `bg` at `opacity`. */
export function blend(fg: string, bg: string, opacity: number): string {
  const a = toRgb(fg);
  const b = toRgb(bg);
  return toHex([0, 1, 2].map((i) => a[i] * opacity + b[i] * (1 - opacity)) as RGB);
}

export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const AA_BODY = 4.5;

export interface ContrastRow {
  surface: string;
  role: string;
  fg: string;
  /** The hardest background this text can land on. */
  worstBg: string;
  ratio: number;
  pass: boolean;
}

/**
 * Every text colour against its surface base and against each stroke colour.
 * A stroke is tested as if two strokes of that colour overlapped, which is the
 * densest paint a field can produce.
 */
export function contrastReport(): ContrastRow[] {
  const rows: ContrastRow[] = [];
  for (const s of Object.values(surfaces) as Surface[]) {
    const grounds = [s.base, ...s.strokes.map((k) => blend(k.color, s.base, 1 - (1 - k.opacity) ** 2))];
    for (const [role, fg] of Object.entries(s.text)) {
      const worst = grounds
        .map((bg) => ({ bg, ratio: contrast(fg, bg) }))
        .sort((a, b) => a.ratio - b.ratio)[0];
      rows.push({
        surface: s.label,
        role,
        fg,
        worstBg: worst.bg,
        ratio: worst.ratio,
        pass: worst.ratio >= AA_BODY,
      });
    }
  }
  for (const c of componentPairs) {
    const bg = blend('#000000', c.bg, c.darken);
    const ratio = contrast(c.fg, bg);
    rows.push({ surface: c.name, role: 'label', fg: c.fg, worstBg: bg, ratio, pass: ratio >= AA_BODY });
  }
  return rows;
}
