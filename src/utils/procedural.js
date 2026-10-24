// Seamless grayscale detail maps for stones, generated on a canvas at runtime.

const SIZE = 512;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// periodic value noise so the texture tiles
function makeNoise(period, seed) {
  const r = rng(seed);
  const lattice = new Float32Array(period * period).map(() => r());
  const at = (x, y) => lattice[((y % period) + period) % period * period + (((x % period) + period) % period)];
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

function fbm(noises, x, y) {
  let sum = 0, amp = 0.5, f = 1;
  for (const n of noises) {
    sum += amp * n(x * f, y * f);
    amp *= 0.5;
    f *= 2;
  }
  return sum;
}

function octaves(base, seed) {
  return [0, 1, 2, 3, 4].map((i) => makeNoise(base << i, seed + i * 17));
}

function fill(fn) {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const v = Math.max(0, Math.min(1, fn(x / SIZE, y / SIZE))) * 255;
      const i = (y * SIZE + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: c, ctx };
}

const generators = {
  marble() {
    const n = octaves(4, 11);
    const m = octaves(8, 31);
    return fill((u, v) => {
      const warp = fbm(n, u * 4, v * 4) * 5.0;
      const vein = Math.abs(Math.sin((u * 2 + v * 3 + warp) * Math.PI));
      const fine = Math.abs(Math.sin((u * 5 - v * 2 + fbm(m, u * 8, v * 8) * 4) * Math.PI));
      return 0.97 - Math.pow(1 - vein, 14) * 0.55 - Math.pow(1 - fine, 30) * 0.25 + (fbm(m, u * 8, v * 8) - 0.5) * 0.06;
    });
  },
  travertine() {
    const n = octaves(4, 5);
    const m = octaves(16, 9);
    const { canvas, ctx } = fill((u, v) => {
      const band = Math.sin((v * 9 + fbm(n, u * 4, v * 4) * 2.2) * Math.PI * 2) * 0.5 + 0.5;
      return 0.8 + band * 0.12 + (fbm(m, u * 16, v * 16) - 0.5) * 0.12;
    });
    // elongated pits, wrapped so the tile stays seamless
    const r = rng(77);
    ctx.fillStyle = "rgba(60,60,60,0.55)";
    for (let i = 0; i < 160; i++) {
      const x = r() * SIZE, y = r() * SIZE, w = 2 + r() * 14, h = 0.8 + r() * 2.2;
      for (const ox of [-SIZE, 0, SIZE]) {
        ctx.beginPath();
        ctx.ellipse(x + ox, y, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return { canvas };
  },
  terrazzo() {
    const m = octaves(16, 3);
    const { canvas, ctx } = fill((u, v) => 0.86 + (fbm(m, u * 16, v * 16) - 0.5) * 0.08);
    const r = rng(1234);
    for (let i = 0; i < 520; i++) {
      const x = r() * SIZE, y = r() * SIZE, s = 2 + Math.pow(r(), 2.4) * 16;
      const tone = r() < 0.55 ? 30 + r() * 60 : 150 + r() * 90;
      ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      const pts = 5 + Math.floor(r() * 4);
      const shape = Array.from({ length: pts }, (_, k) => [(k / pts) * Math.PI * 2, s * (0.6 + r() * 0.5)]);
      for (const ox of [-SIZE, 0, SIZE])
        for (const oy of [-SIZE, 0, SIZE]) {
          ctx.beginPath();
          shape.forEach(([a, rad], k) => {
            const px = x + ox + Math.cos(a) * rad, py = y + oy + Math.sin(a) * rad;
            k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          });
          ctx.fill();
        }
    }
    return { canvas };
  },
};

const cache = new Map();
export function proceduralCanvas(name) {
  if (!cache.has(name)) cache.set(name, generators[name]().canvas);
  return cache.get(name);
}
