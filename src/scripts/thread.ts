// Scroll draws the thread and moves the ball along it.
//
// The page is a chain of segments (drawings and notes), each with one piece of the
// thread. A "pen line" sits part way down the window. A segment is drawn from the
// moment its top reaches the pen line until its bottom does, so the pieces follow
// one another without a gap.

const PEN = 0.62; // the pen line, as a share of the window height

interface Segment {
  box: Element;
  path: SVGPathElement;
  length: number;
  cues: { el: Element; at: number }[];
  start: number;
  end: number;
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function mountThread(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.querySelector<HTMLElement>('.notebook');
  const ball = document.querySelector<HTMLElement>('[data-ball]');
  if (!root) return;

  const segments: Segment[] = [...root.querySelectorAll('[data-segment]')].flatMap((box) => {
    const path = box.querySelector<SVGPathElement>('[data-thread]');
    if (!path) return [];
    const cues = [...box.querySelectorAll('[data-at]')].map((el) => ({
      el,
      at: Number(el.getAttribute('data-at')),
    }));
    return [{ box, path, length: path.getTotalLength(), cues, start: 0, end: 1 }];
  });
  if (!segments.length) return;

  document.documentElement.classList.add('thread-live');
  if (ball) ball.hidden = false;
  let unit = 1; // screen pixels per drawing unit
  let rolled = 0;
  let lastX = 0;
  let lastY = 0;
  let placed = false;

  function measure(): void {
    const pen = innerHeight * PEN;
    let previous = 0;
    for (const s of segments) {
      const r = s.box.getBoundingClientRect();
      s.start = previous;
      s.end = Math.max(previous + 1, r.bottom + scrollY - pen);
      previous = s.end;
    }
    unit = root!.getBoundingClientRect().width / 600;
    const svg = ball?.firstElementChild as SVGElement | null;
    if (svg) {
      const size = 28 * unit;
      svg.style.width = svg.style.height = `${size}px`;
      svg.style.left = svg.style.top = `${-size / 2}px`;
    }
  }

  function draw(): void {
    const y = scrollY;
    let active = segments[0]!;
    let activeP = 0;
    for (const s of segments) {
      const p = clamp((y - s.start) / (s.end - s.start));
      s.path.style.strokeDashoffset = String(1 - p);
      s.path.style.visibility = p > 0 ? 'visible' : 'hidden';
      for (const c of s.cues) c.el.classList.toggle('on', p >= c.at);
      if (p > 0 || s === segments[0]) {
        active = s;
        activeP = p;
      }
    }
    if (!ball) return;
    const at = active.path.getPointAtLength(activeP * active.length);
    const m = active.path.getScreenCTM();
    if (!m) return;
    const origin = root!.getBoundingClientRect();
    const x = at.x * m.a + at.y * m.c + m.e - origin.left;
    const yy = at.x * m.b + at.y * m.d + m.f - origin.top;
    if (placed) rolled += ((x - lastX) / (12 * unit)) * 57.3 + ((yy - lastY) / (12 * unit)) * 20;
    placed = true;
    lastX = x;
    lastY = yy;
    ball.style.transform = `translate(${x.toFixed(1)}px, ${yy.toFixed(1)}px) rotate(${rolled.toFixed(1)}deg)`;
  }

  let queued = false;
  function onScroll(): void {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      draw();
    });
  }
  function onResize(): void {
    measure();
    draw();
  }

  measure();
  draw();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  // Fonts change the height of the notes when they arrive.
  void document.fonts?.ready.then(onResize);
  new ResizeObserver(onResize).observe(root);
}
