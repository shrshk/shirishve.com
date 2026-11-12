// Paints the About portrait from a photograph, one brush stroke at a time.
// Run by hand when the photo changes: `npm run portrait`. The output is committed.
//
// Method: strokes go down in layers from a wide brush to a fine one. Each stroke takes
// its colour from the photo under it and follows the edges in the photo. The sky is not
// copied: it is repainted as pale swirls that follow a flow field.
import sharp from 'sharp';

const SRC = 'src/assets/portrait-source.jpg';
const OUT = 'public/images/portrait.webp';
const W = 640;
const H = 800;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(1889);

const photo = sharp(SRC).resize(W, H);
const pixels = async (sigma) => (await photo.clone().blur(sigma).removeAlpha().raw().toBuffer()).valueOf();
const at = (x, y) => Math.min(H - 1, Math.max(0, y | 0)) * W + Math.min(W - 1, Math.max(0, x | 0));

function hsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function rgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor(h / 60) % 6];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

// --- The sky: light blue pixels joined to the edge of the picture. ---
const soft = await pixels(2);
const sky = new Uint8Array(W * H);
{
  const pale = (i) => {
    const [, , l] = hsl(soft[i * 3], soft[i * 3 + 1], soft[i * 3 + 2]);
    // Light, and bluer than it is red. Skin and the yellow jacket are redder than blue.
    return l > 0.55 && soft[i * 3 + 2] - soft[i * 3] > 15;
  };
  const queue = [];
  const push = (x, y) => {
    const i = y * W + x;
    if (x < 0 || y < 0 || x >= W || y >= H || sky[i] || !pale(i)) return;
    sky[i] = 1;
    queue.push(i);
  };
  for (let x = 0; x < W; x++) push(x, 0);
  for (let y = 0; y < H; y++) {
    push(0, y);
    push(W - 1, y);
  }
  while (queue.length) {
    const i = queue.pop();
    const x = i % W;
    const y = (i / W) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
}

// --- Edges in the photo: strokes run along them. ---
const smooth = await pixels(3.5);
const lum = new Float32Array(W * H);
for (let i = 0; i < W * H; i++)
  lum[i] = (0.299 * smooth[i * 3] + 0.587 * smooth[i * 3 + 1] + 0.114 * smooth[i * 3 + 2]) / 255;
const grad = (x, y) => {
  const gx = lum[at(x + 2, y)] - lum[at(x - 2, y)];
  const gy = lum[at(x, y + 2)] - lum[at(x, y - 2)];
  return [gx, gy, Math.hypot(gx, gy)];
};

// --- Flow for the sky: the curl of a slow potential, plus a turn around the head. ---
const psi = (x, y) =>
  Math.sin(x / 74 + 1.3) * Math.cos(y / 58 - 0.4) +
  0.6 * Math.sin((x + y) / 43) +
  0.5 * Math.cos((x - 1.6 * y) / 61) +
  1.5 * Math.exp(-((x - 120) ** 2 + (y - 210) ** 2) / 9000) -
  1.4 * Math.exp(-((x - 540) ** 2 + (y - 150) ** 2) / 8000);
const skyAngle = (x, y) => Math.atan2(-(psi(x + 1, y) - psi(x - 1, y)), psi(x, y + 1) - psi(x, y - 1));
const SKY = ['#3F78A6', '#5B93B8', '#7AAFC8', '#9CC7D6', '#BFDBDD', '#E9F1E2'];

function skyColour(x, y) {
  const band = 0.5 + 0.5 * Math.sin(psi(x, y) * 4.6);
  const light = lum[at(x, y)];
  const t = clamp(0.12 + 0.62 * band + 0.16 * clamp((light - 0.62) * 3.2) + (rand() - 0.5) * 0.5);
  return SKY[Math.min(SKY.length - 1, Math.floor(t * SKY.length))];
}

function figureColour(ref, x, y) {
  const i = at(x, y) * 3;
  let [h, s, l] = hsl(ref[i], ref[i + 1], ref[i + 2]);
  s = clamp(s * 1.35 + 0.04);
  l = clamp((l - 0.5) * 1.12 + 0.5 + (rand() - 0.5) * 0.07);
  h = (h + (rand() - 0.5) * 10 + 360) % 360;
  const [r, g, b] = rgb(h, s, l);
  return `rgb(${r},${g},${b})`;
}

const out = [];
function stroke(x, y, angleAt, length, width, colour, opacity, same) {
  const pts = [[x, y]];
  const seg = length / 4;
  let px = x;
  let py = y;
  let prev = angleAt(px, py);
  for (let k = 0; k < 4; k++) {
    let a = angleAt(px, py);
    // A direction has no sign: keep going the way the stroke already goes.
    if (Math.cos(a - prev) < 0) a += Math.PI;
    prev = a;
    px += Math.cos(a) * seg;
    py += Math.sin(a) * seg;
    if (px < -8 || py < -8 || px > W + 8 || py > H + 8 || !same(px, py)) break;
    pts.push([px, py]);
  }
  if (pts.length < 2) return;
  const d = pts.map(([a, b], k) => `${k ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`).join('');
  out.push(
    `<path d="${d}" stroke="${colour}" stroke-width="${width.toFixed(1)}" stroke-opacity="${opacity}"/>`,
  );
}

const isSky = (x, y) => sky[at(x, y)] === 1;
const drift = (x, y) => 1.2 + 0.7 * Math.sin(x / 90) + 0.5 * Math.cos(y / 70);

// Brush width, grid step, and the least edge strength a stroke needs to be painted.
const layers = [
  { width: 24, step: 9, detail: 0 },
  { width: 13, step: 6, detail: 0 },
  { width: 7, step: 4, detail: 0 },
  { width: 3.6, step: 2.6, detail: 0.02 },
  { width: 2.2, step: 2, detail: 0.045 },
];

for (const layer of layers) {
  const ref = await pixels(Math.max(0.6, layer.width / 3.2));
  const spots = [];
  for (let y = 0; y < H; y += layer.step)
    for (let x = 0; x < W; x += layer.step)
      spots.push([x + (rand() - 0.5) * layer.step, y + (rand() - 0.5) * layer.step]);
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [spots[i], spots[j]] = [spots[j], spots[i]];
  }
  for (const [x, y] of spots) {
    if (isSky(x, y)) {
      if (layer.width < 6) continue;
      const w = layer.width * (0.75 + rand() * 0.4);
      stroke(x, y, skyAngle, w * (3.5 + rand() * 2.5), w, skyColour(x, y), 0.92, isSky);
    } else {
      const [, , mag] = grad(x, y);
      if (mag < layer.detail) continue;
      const along = (px, py) => {
        const [gx, gy, m] = grad(px, py);
        return m > 0.01 ? Math.atan2(gy, gx) + Math.PI / 2 : drift(px, py);
      };
      const w = layer.width * (0.75 + rand() * 0.4);
      stroke(x, y, along, w * (2.2 + rand() * 1.6), w, figureColour(ref, x, y), 0.94, (a, b) => !isSky(a, b));
    }
  }
}

// --- A dark contour where the figure meets the sky, as in the paintings. ---
// The edge direction comes from a blurred copy of the sky mask, so the line runs smooth.
const mask = (
  await sharp(Buffer.from(sky.map((v) => v * 255)), { raw: { width: W, height: H, channels: 1 } })
    .blur(5)
    .toColourspace('b-w')
    .raw()
    .toBuffer()
).valueOf();
const edgeAngle = (x, y) =>
  Math.atan2(mask[at(x, y + 3)] - mask[at(x, y - 3)], mask[at(x + 3, y)] - mask[at(x - 3, y)]) + Math.PI / 2;
for (let y = 2; y < H - 2; y += 4)
  for (let x = 2; x < W - 2; x += 4) {
    const m = mask[at(x, y)];
    if (m < 60 || m > 130 || rand() < 0.3) continue;
    stroke(x, y, edgeAngle, 16 + rand() * 14, 2.2 + rand() * 1.4, '#101B3B', 0.42, () => true);
  }

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}">
<rect width="${W}" height="${H}" fill="#86B7CB"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">${out.join('')}</g></svg>`;

await sharp(Buffer.from(svg), { limitInputPixels: false, unlimited: true })
  .resize(W, H)
  .webp({ quality: 80 })
  .toFile(OUT);
console.log(`${out.length} strokes -> ${OUT}`);
