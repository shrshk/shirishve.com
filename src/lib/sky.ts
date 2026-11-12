// The hero sky. Runs in the browser.
//
// A few thousand short strokes drift along a divergence-free flow: the curl of a
// slowly changing noise potential, plus one vortex per star. Every frame the whole
// sky is repainted, so strokes glide and fade; nothing pops in or out.

export interface StarSpec {
  /** Centre as a fraction of the sky's width and height. */
  x: number;
  y: number;
  /** Radius as a fraction of the shorter side. */
  r: number;
}

export interface PlacedStar {
  x: number;
  y: number;
  r: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface SkyOptions {
  landscape: StarSpec[];
  portrait: StarSpec[];
  /** One finished frame, no animation. */
  reduced: boolean;
  /** The box that holds the text. The sky keeps to its dark blues there. */
  calmZone: () => Rect | null;
  onLayout: (stars: PlacedStar[], width: number, height: number) => void;
}

export interface Sky {
  start(): void;
  stop(): void;
  resize(): void;
  /** Strokes on screen now. */
  count(): number;
}

// Paint order: dark blues first, warm star colours last.
const COLORS = [
  '#0A1230',
  '#14285A',
  '#1F4E8C',
  '#1B4480',
  '#2A5FA3',
  '#3A72B5',
  '#4F86C6',
  '#5E9FB0',
  '#7DBDB4',
  '#C98A1B',
  '#E3A823',
  '#F2C230',
  '#F7DC7A',
  '#FBF4DF',
];
const DARK_BLUES = 4; // COLORS[0..3]: safe under text
const BLUES = 7;
const WIDTHS = [4.2, 6.2, 8.6];
const ALPHAS = 6;
const NIGHT = '#101B3B';

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mountSky(canvas: HTMLCanvasElement, options: SkyOptions): Sky {
  const ctx = canvas.getContext('2d', { alpha: false })!;
  const rand = mulberry(1889);

  let w = 0;
  let h = 0;
  let dpr = 1;
  let scale = 1;
  let stars: PlacedStar[] = [];
  let calm: Rect | null = null;
  let starWeight = 0;

  // Particles. Sized for the largest sky; `n` of them are live.
  const MAX = 4200;
  let n = 0;
  const px = new Float32Array(MAX);
  const py = new Float32Array(MAX);
  const life = new Float32Array(MAX);
  const rate = new Float32Array(MAX);
  const speed = new Float32Array(MAX);
  const len = new Float32Array(MAX);
  const tint = new Uint8Array(MAX);
  const wide = new Uint8Array(MAX);

  // The noise potential: a handful of plane waves with slowly turning phases.
  const WAVES = 6;
  const kx = new Float32Array(WAVES);
  const ky = new Float32Array(WAVES);
  const amp = new Float32Array(WAVES);
  const phase = new Float32Array(WAVES);
  const omega = new Float32Array(WAVES);

  let t = 0;
  let fx = 1;
  let fy = 0;
  let near = 9;

  /** Flow direction at a point, into fx/fy. Also sets `near`: distance to the closest star, in star radii. */
  function field(x: number, y: number): void {
    let vx = 0.55;
    let vy = 0;
    for (let i = 0; i < WAVES; i++) {
      const c = Math.cos(kx[i] * x + ky[i] * y + phase[i] + omega[i] * t) * amp[i];
      vx += c * ky[i];
      vy -= c * kx[i];
    }
    near = 9;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const dx = x - s.x;
      const dy = y - s.y;
      const d2 = dx * dx + dy * dy;
      const sigma = s.r * 1.15;
      const ratio = Math.sqrt(d2) / s.r;
      if (ratio < near) near = ratio;
      if (ratio < 4.5) {
        const g = (7 * Math.exp(-d2 / (2 * sigma * sigma))) / sigma;
        vx -= g * dy;
        vy += g * dx;
      }
    }
    const m = Math.hypot(vx, vy) || 1;
    fx = vx / m;
    fy = vy / m;
  }

  /** A stroke takes its colour where it is born and keeps it. */
  function spawn(i: number, fresh: boolean): void {
    if (stars.length && rand() < 0.24) {
      // About a quarter of the strokes are born in a star's halo, so even a small star is well painted.
      let pick = rand() * starWeight;
      let s = stars[0];
      for (const star of stars) {
        s = star;
        if ((pick -= star.r) <= 0) break;
      }
      const a = rand() * Math.PI * 2;
      const d = s.r * (0.22 + rand() * 1.08);
      px[i] = s.x + Math.cos(a) * d;
      py[i] = s.y + Math.sin(a) * d;
    } else {
      px[i] = rand() * w;
      py[i] = rand() * h;
    }
    life[i] = fresh ? rand() : 0;
    rate[i] = 1 / (9 + rand() * 9);
    len[i] = (22 + rand() * 36) * scale;
    wide[i] = Math.floor(rand() * 3);
    field(px[i], py[i]);
    speed[i] = (5 + rand() * 6) * scale * (near < 1.6 ? 1.7 : 1);
    const c = Math.floor(rand() * 256);
    if (near < 0.34) tint[i] = 13;
    else if (near < 0.62) tint[i] = 12 - (c & 1);
    else if (near < 0.95) tint[i] = 9 + (c % 3);
    else if (near < 1.3) tint[i] = [8, 9, 7][c % 3];
    else if (py[i] > h * 0.7 && c % 5 === 0) tint[i] = 7;
    else tint[i] = c % BLUES;
  }

  function resize(): void {
    const box = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(box.width));
    h = Math.max(1, Math.round(box.height));
    dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 2 : 1.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const short = Math.min(w, h);
    scale = Math.max(0.7, Math.min(1.25, short / 800));

    const specs = w / h < 0.8 ? options.portrait : options.landscape;
    stars = specs.map((s) => ({ x: s.x * w, y: s.y * h, r: s.r * short }));
    starWeight = stars.reduce((sum, s) => sum + s.r, 0);
    calm = options.calmZone();

    const fieldRand = mulberry(7);
    for (let i = 0; i < WAVES; i++) {
      const wavelength = short * (0.45 + fieldRand() * 0.95);
      const k = (Math.PI * 2) / wavelength;
      const a = fieldRand() * Math.PI * 2;
      kx[i] = Math.cos(a) * k;
      ky[i] = Math.sin(a) * k;
      amp[i] = 1 / k;
      phase[i] = fieldRand() * Math.PI * 2;
      omega[i] = (fieldRand() - 0.5) * 0.16;
    }

    // Strokes shrink on small screens, so it takes more of them to cover the same share of sky.
    n = Math.max(900, Math.min(MAX, Math.round((w * h) / (300 * scale * scale))));
    for (let i = 0; i < n; i++) spawn(i, true);
    options.onLayout(stars, w, h);
    draw();
  }

  // One list of curve coordinates per colour, width and opacity step.
  const buckets: number[][] = Array.from({ length: COLORS.length * WIDTHS.length * ALPHAS }, () => []);

  function draw(): void {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = NIGHT;
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';

    for (let i = 0; i < n; i++) {
      const x = px[i];
      const y = py[i];
      // Fade in and out over the first and last fifth of a stroke's life.
      let a = options.reduced ? 1 : Math.min(1, life[i] * 5, (1 - life[i]) * 5);
      if (calm && tint[i] >= DARK_BLUES) {
        // Light strokes thin out as they come near the text.
        const inside = Math.min(x - calm.left, calm.right - x, y - calm.top, calm.bottom - y);
        const margin = 60 * scale;
        if (inside > -margin) a *= Math.max(0, -inside / margin);
      }
      const step = Math.round(a * ALPHAS);
      if (step <= 0) continue;
      field(x, y);
      const half = len[i] / 2;
      const ax = x - fx * half;
      const ay = y - fy * half;
      const ux = fx;
      const uy = fy;
      field(x + ux * half, y + uy * half);
      const b = buckets[(tint[i] * WIDTHS.length + wide[i]) * ALPHAS + step - 1];
      b.push(ax, ay, x, y, x + (ux + fx) * 0.5 * half, y + (uy + fy) * 0.5 * half);
    }

    for (let k = 0; k < buckets.length; k++) {
      const b = buckets[k];
      if (!b.length) continue;
      const color = Math.floor(k / (WIDTHS.length * ALPHAS));
      const width = Math.floor(k / ALPHAS) % WIDTHS.length;
      ctx.beginPath();
      for (let j = 0; j < b.length; j += 6) {
        ctx.moveTo(b[j], b[j + 1]);
        ctx.quadraticCurveTo(b[j + 2], b[j + 3], b[j + 4], b[j + 5]);
      }
      ctx.strokeStyle = COLORS[color];
      ctx.lineWidth = WIDTHS[width] * scale;
      ctx.globalAlpha = (((k % ALPHAS) + 1) / ALPHAS) * 0.92;
      ctx.stroke();
      b.length = 0;
    }

    // Star cores.
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFFBEA';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.17, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let running = false;
  let raf = 0;
  let last = 0;
  let slow = 0;
  let frames = 0;

  function frame(now: number): void {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    for (let i = 0; i < n; i++) {
      field(px[i], py[i]);
      px[i] += fx * speed[i] * dt;
      py[i] += fy * speed[i] * dt;
      life[i] += rate[i] * dt;
      if (life[i] >= 1) spawn(i, false);
    }
    draw();

    // If the device cannot hold the frame rate, paint fewer strokes.
    slow = slow * 0.95 + dt * 0.05;
    if (++frames > 90 && slow > 0.022 && n > 700) {
      n = Math.round(n * 0.8);
      frames = 0;
    }
    raf = requestAnimationFrame(frame);
  }

  resize();

  return {
    start() {
      if (running || options.reduced) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    resize,
    count: () => n,
  };
}
