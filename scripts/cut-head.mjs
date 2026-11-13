// Cuts the head out of the portrait photograph and redraws it as a crayon paper cut-out
// for the notebook pages. Run by hand when the photo changes: `npm run head`.
// The output is committed.
//
// Method: find the sky by flood fill from the edges, keep what is inside an ellipse
// round the head, flatten the colours into a few crayon tones, lighten the beard,
// ink the strong edges, then add a paper rim like a sticker.
import sharp from 'sharp';

const SRC = 'src/assets/portrait-source.jpg';
const OUT = 'public/images/head.webp';
// The head in the photograph, with room for the rim.
const BOX = { left: 300, top: 104, width: 340, height: 400 };
const HEAD = { cx: 466 - BOX.left, cy: 300 - BOX.top, rx: 150, ry: 180 };
const INK = [59, 47, 42];
const PAPER = [255, 253, 246];
const W = BOX.width;
const H = BOX.height;

const crop = sharp(SRC).extract(BOX);
const raw = async (img) => (await img.removeAlpha().raw().toBuffer()).valueOf();
const flat = await raw(crop.clone().median(3));
// How far the beard moves toward skin: 0 leaves it, 1 removes it.
const BEARD_LIGHTEN = 0.4;
const soft = await raw(crop.clone().blur(2));
const lum = (buf, i) => 0.299 * buf[i * 3] + 0.587 * buf[i * 3 + 1] + 0.114 * buf[i * 3 + 2];

// --- sky: pale blue pixels joined to the edge of the crop ---
const sky = new Uint8Array(W * H);
{
  const pale = (i) => lum(soft, i) > 140 && soft[i * 3 + 2] - soft[i * 3] > 12;
  const queue = [];
  const push = (x, y) => {
    const i = y * W + x;
    if (x < 0 || y < 0 || x >= W || y >= H || sky[i] || !pale(i)) return;
    sky[i] = 1;
    queue.push(i);
  };
  for (let x = 0; x < W; x++) push(x, 0);
  for (let y = 0; y < H; y++) (push(0, y), push(W - 1, y));
  while (queue.length) {
    const i = queue.pop();
    const x = i % W;
    const y = (i / W) | 0;
    (push(x + 1, y), push(x - 1, y), push(x, y + 1), push(x, y - 1));
  }
}
const inHead = (x, y) => ((x - HEAD.cx) / HEAD.rx) ** 2 + ((y - HEAD.cy) / HEAD.ry) ** 2 <= 1;
const mask = Buffer.alloc(W * H);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) mask[y * W + x] = !sky[y * W + x] && inHead(x, y) ? 255 : 0;
const blurMask = async (sigma) =>
  (
    await sharp(mask, { raw: { width: W, height: H, channels: 1 } })
      .blur(sigma)
      .toColourspace('b-w')
      .raw()
      .toBuffer()
  ).valueOf();
const edgeSoft = await blurMask(1.2);
const grown = await blurMask(4);

// --- the cut-out ---
// The face stays a photograph. Flattening it into crayon tones made it a stranger.
const out = Buffer.alloc(W * H * 4);
const SKIN = [196, 138, 100];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    let r = flat[i * 3];
    let g = flat[i * 3 + 1];
    let b = flat[i * 3 + 2];
    const l = lum(flat, i);
    // the day was grey: lift the shadows, warm the skin, a little more colour
    const lift = 1.1 + 0.25 * (1 - l / 255);
    const mean = ((r + g + b) / 3) * lift;
    r = mean + (r * lift - mean) * 1.18 + 5;
    g = mean + (g * lift - mean) * 1.12 + 1;
    b = mean + (b * lift - mean) * 1.05 - 5;
    // the beard: dark pixels in the lower face move toward skin
    const lower = Math.min(1, Math.max(0, (y - (HEAD.cy + 20)) / 24));
    if (lower > 0 && l < 110) {
      const t = BEARD_LIGHTEN * lower * Math.min(1, (110 - l) / 55);
      r += (SKIN[0] - r) * t;
      g += (SKIN[1] - g) * t;
      b += (SKIN[2] - b) * t;
    }
    // sticker: the photo, then a paper rim, then a thin ink line
    const a = edgeSoft[i] / 255;
    let px = [PAPER[0] * (1 - a) + r * a, PAPER[1] * (1 - a) + g * a, PAPER[2] * (1 - a) + b * a];
    let alpha = 255;
    if (a < 0.02) {
      if (grown[i] > 46) px = PAPER;
      else if (grown[i] > 22) px = INK;
      else alpha = Math.min(255, Math.max(0, (grown[i] - 12) * 25));
      if (alpha < 255 && grown[i] <= 22) px = INK;
    }
    out[i * 4] = Math.max(0, Math.min(255, px[0]));
    out[i * 4 + 1] = Math.max(0, Math.min(255, px[1]));
    out[i * 4 + 2] = Math.max(0, Math.min(255, px[2]));
    out[i * 4 + 3] = alpha;
  }
}
await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .webp({ quality: 88 })
  .toFile(OUT);
console.log(`wrote ${OUT} ${W}x${H}`);
