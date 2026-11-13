// Hand-drawn geometry for the notebook pages, made when the site is built.
// The wobble is in the points themselves, so no SVG filter is needed and
// nothing has to be redrawn when the page scrolls.

export type Pt = readonly [number, number];

/** Small seeded generator (mulberry32). The same seed always draws the same line. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Points of y = f(x) between two x values. */
export function plot(f: (x: number) => number, x0: number, x1: number, n = 48): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / n;
    return [x, f(x)] as const;
  });
}

/** A circular arc. Angles in radians, measured as on paper: anticlockwise, y up. */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 48): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
  });
}

/** A cubic Bézier curve as points. */
export function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 32): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return [
      a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    ] as const;
  });
}

/** Join pieces into one polyline, dropping the repeated point where two pieces meet. */
export function join(...pieces: Pt[][]): Pt[] {
  const out: Pt[] = [];
  for (const piece of pieces) {
    for (const p of piece) {
      const last = out[out.length - 1];
      if (last && Math.hypot(last[0] - p[0], last[1] - p[1]) < 0.01) continue;
      out.push(p);
    }
  }
  return out;
}

/** The same polyline with a point every `step` units, so the wobble is even along it. */
export function resample(pts: Pt[], step = 5): Pt[] {
  const first = pts[0];
  if (!first) return [];
  const out: Pt[] = [first];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let at = step - carry;
    while (at <= len) {
      out.push([a[0] + ((b[0] - a[0]) * at) / len, a[1] + ((b[1] - a[1]) * at) / len]);
      at += step;
    }
    carry = len - (at - step);
  }
  const last = pts[pts.length - 1]!;
  const tail = out[out.length - 1]!;
  if (Math.hypot(tail[0] - last[0], tail[1] - last[1]) > 0.01) out.push(last);
  return out;
}

/**
 * A slow drift off the true line, as a hand makes. Both ends stay exact,
 * so one piece of line meets the next without a step.
 */
export function wobble(pts: Pt[], seed: number, amp = 1.3, every = 7): Pt[] {
  const rand = rng(seed);
  const knots = Math.ceil(pts.length / every) + 2;
  const kx = Array.from({ length: knots }, () => rand() * 2 - 1);
  const ky = Array.from({ length: knots }, () => rand() * 2 - 1);
  const ease = (t: number) => (1 - Math.cos(t * Math.PI)) / 2;
  const fade = Math.min(6, Math.floor(pts.length / 2));
  return pts.map(([x, y], i) => {
    const k = Math.floor(i / every);
    const t = ease((i % every) / every);
    const edge = Math.min(1, i / fade, (pts.length - 1 - i) / fade);
    const dx = (kx[k]! * (1 - t) + kx[k + 1]! * t) * amp * edge;
    const dy = (ky[k]! * (1 - t) + ky[k + 1]! * t) * amp * edge;
    return [x + dx, y + dy] as const;
  });
}

/** SVG path data for a polyline. */
export function d(pts: Pt[]): string {
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
}

/** A hand-drawn line through the points. */
export function hand(pts: Pt[], seed: number, amp = 1.3): string {
  return d(wobble(resample(pts), seed, amp));
}

/** A hand-drawn straight line. */
export function stroke(a: Pt, b: Pt, seed: number, amp = 1.1): string {
  return hand([a, b], seed, amp);
}

/** Where the thread enters and leaves every stage: the right margin. */
export const MARGIN_X = 540;
/** Every stage is this many units wide. */
export const STAGE_W = 600;
