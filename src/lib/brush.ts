// Build-time brushwork. Everything here is deterministic from a seed, so the
// painting is the same on every build and nothing is drawn in the browser.
import type { StrokeSpec } from './palette';

/** mulberry32: small seeded PRNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n1 = (v: number) => Math.round(v * 10) / 10;
const n0 = (v: number) => Math.round(v);

const TAU = Math.PI * 2;

/**
 * Direction of the paint at a point: a base angle bent by a few slow waves.
 * x and y are 0..1 across the tile, and the waves are whole periods, so the
 * field joins up with itself when the tile repeats.
 */
function flow(x: number, y: number, seed: number, angle: number, swirl: number): number {
  return (
    angle +
    swirl *
      (Math.sin(TAU * x + seed) * Math.cos(TAU * y - seed * 1.7) +
        0.5 * Math.sin(TAU * (2 * x + y) + seed * 0.3))
  );
}

export interface FieldOptions {
  seed: number;
  strokes: StrokeSpec[];
  width?: number;
  height?: number;
  /** Grid cell in px; one stroke per cell. Smaller is denser. */
  cell?: number;
  length?: [number, number];
  thickness?: [number, number];
  angle?: number;
  swirl?: number;
}

export interface FieldLayer {
  color: string;
  opacity: number;
  width: number;
  d: string;
}

/**
 * A field of short curved strokes on a jittered grid, following the flow.
 * Strokes of one colour and width share one path, so a field is about a dozen
 * DOM nodes and same-colour overlaps do not stack opacity.
 * The field tiles: a stroke that leaves one edge comes back in at the other.
 */
export function strokeField(o: FieldOptions): FieldLayer[] {
  const W = o.width ?? 1200;
  const H = o.height ?? 800;
  const nx = Math.round(W / (o.cell ?? 40));
  const ny = Math.round(H / (o.cell ?? 40));
  const [lenMin, lenMax] = o.length ?? [40, 96];
  const [thMin, thMax] = o.thickness ?? [6, 15];
  const widths = [thMin, (thMin + thMax) / 2, thMax];
  const rand = rng(o.seed);
  const total = o.strokes.reduce((s, k) => s + k.weight, 0);
  const layers = new Map<string, FieldLayer>();
  const angle = o.angle ?? 0;
  const swirl = o.swirl ?? 1;

  for (let gy = 0; gy < ny; gy++) {
    for (let gx = 0; gx < nx; gx++) {
      const x = ((gx + rand()) * W) / nx;
      const y = ((gy + rand()) * H) / ny;
      let pick = rand() * total;
      let index = 0;
      while (pick > o.strokes[index].weight) pick -= o.strokes[index++].weight;
      const spec = o.strokes[index];
      const bucket = Math.floor(rand() * 3);
      const len = lenMin + rand() * (lenMax - lenMin);
      const a0 = flow(x / W, y / H, o.seed, angle, swirl) + (rand() - 0.5) * 0.35;
      const mx = (Math.cos(a0) * len) / 2;
      const my = (Math.sin(a0) * len) / 2;
      const a1 = flow((x + mx) / W, (y + my) / H, o.seed, angle, swirl) + (rand() - 0.5) * 0.5;
      const ex = mx + (Math.cos(a1) * len) / 2;
      const ey = my + (Math.sin(a1) * len) / 2;
      const key = `${index}:${bucket}`;
      const layer = layers.get(key) ?? {
        color: spec.color,
        opacity: spec.opacity,
        width: widths[bucket],
        d: '',
      };
      const curve = `q${n0(mx)} ${n0(my)} ${n0(ex)} ${n0(ey)}`;
      const pad = widths[bucket];
      for (const sx of [0, -W, W]) {
        for (const sy of [0, -H, H]) {
          const x0 = x + sx;
          const y0 = y + sy;
          const inX = Math.max(x0, x0 + ex) > -pad && Math.min(x0, x0 + ex) < W + pad;
          const inY = Math.max(y0, y0 + ey) > -pad && Math.min(y0, y0 + ey) < H + pad;
          if (inX && inY) layer.d += `M${n0(x0)} ${n0(y0)}${curve}`;
        }
      }
      layers.set(key, layer);
    }
  }
  // Paint in the order the strokes are listed: grounds first, highlights last.
  return [...layers.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, layer]) => layer);
}

export interface EdgeOptions {
  width?: number;
  height?: number;
  /** 0..1: how far up the band the paint reaches on average. */
  reach?: number;
}

/** A band of paint with a ragged, bristled top edge. It fills down to the bottom of the box. */
export function raggedEdge(seed: number, o: EdgeOptions = {}): string {
  const W = o.width ?? 1200;
  const H = o.height ?? 100;
  const reach = o.reach ?? 0.5;
  const rand = rng(seed);
  const p1 = rand() * 6.28;
  const p2 = rand() * 6.28;
  let d = `M0 ${H}`;
  for (let x = 0; x <= W; x += 5 + rand() * 11) {
    const t = (x / W) * 6.28;
    let y = H * (1 - reach) + Math.sin(t * 1.5 + p1) * H * 0.14 + Math.sin(t * 6 + p2) * H * 0.06;
    y += (rand() - 0.5) * H * 0.2;
    if (rand() < 0.12) y -= rand() * H * 0.28; // a bristle that ran ahead
    d += `L${n1(x)} ${n1(Math.max(1, Math.min(H - 2, y)))}`;
  }
  return `${d}L${W} ${H}Z`;
}

/** Dry-brush streaks that trail above a ragged edge. */
export function streaks(seed: number, count: number, o: EdgeOptions = {}): string {
  const W = o.width ?? 1200;
  const H = o.height ?? 100;
  const rand = rng(seed);
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = rand() * W;
    const y = H * (0.08 + rand() * 0.5);
    const len = 30 + rand() * 120;
    d += `M${n1(x)} ${n1(y)}q${n1(len / 2)} ${n1((rand() - 0.5) * 8)} ${n1(len)} ${n1((rand() - 0.5) * 6)}`;
  }
  return d;
}

/** A closed, slightly uneven round shape: a daub of paint or a wax seal. */
export function blob(seed: number, r = 28, cx = 32, cy = 32, points = 9, wobble = 0.13): string {
  const rand = rng(seed);
  const p = Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2 + (rand() - 0.5) * 0.3;
    const rr = r * (1 + (rand() - 0.5) * 2 * wobble);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  const at = (i: number) => p[(i + points) % points];
  let d = `M${n1(p[0][0])} ${n1(p[0][1])}`;
  for (let i = 0; i < points; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d +=
      `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ` +
      `${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return `${d}Z`;
}

/** One loaded brush stroke as a filled shape: fat in the middle, frayed where the brush lifts. */
export function brushStroke(seed: number, W = 300, H = 24): string {
  const rand = rng(seed);
  const top: string[] = [];
  const bottom: string[] = [];
  for (let x = 6; x <= W - 18; x += 8 + rand() * 10) {
    const belly = Math.sin((x / W) * Math.PI) * H * 0.12;
    top.push(`L${n1(x)} ${n1(H * 0.22 - belly + (rand() - 0.5) * H * 0.14)}`);
    bottom.unshift(`L${n1(x)} ${n1(H * 0.78 + belly + (rand() - 0.5) * H * 0.14)}`);
  }
  // Frayed tail: a few bristles of different length.
  let tail = '';
  const teeth = 4;
  for (let i = 0; i <= teeth; i++) {
    const y = H * (0.2 + (0.6 * i) / teeth);
    tail += `L${n1(W - rand() * 16)} ${n1(y)}`;
    if (i < teeth) tail += `L${n1(W - 14 - rand() * 14)} ${n1(y + (H * 0.3) / teeth)}`;
  }
  return `M2 ${n1(H * 0.5)}Q3 ${n1(H * 0.2)} 6 ${n1(H * 0.24)}${top.join('')}${tail}${bottom.join('')}Q3 ${n1(H * 0.8)} 2 ${n1(H * 0.5)}Z`;
}

/** A hand-drawn line that is nearly, but not, straight. */
export function wobble(seed: number, W = 200, amp = 2.5): string {
  const rand = rng(seed);
  let d = `M2 ${n1(6 + (rand() - 0.5) * amp)}`;
  for (let x = 2; x < W - 2;) {
    const step = Math.min(18 + rand() * 30, W - 2 - x);
    x += step;
    d += `q${n1(step / 2)} ${n1((rand() - 0.5) * amp * 2)} ${n1(step)} ${n1((rand() - 0.5) * amp)}`;
  }
  return d;
}
