import { MATERIALS } from "../../../data/materials";
import { formatPrice } from "../../../data/pricing";

/** Draws an A4 spec sheet (title block, render, configuration table) and downloads it as PNG. */
export function downloadSpecSheet({ spec, cfg, price, image }) {
  const W = 1240, H = 1754, M = 80;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  const ink = "#111214", dim = "#6b6e72", tape = "#f4c20d", paper = "#e7e8e4";
  const font = (size, weight = 500, stretch = "semi-condensed") => {
    g.fontStretch = stretch;
    g.font = `${weight} ${size}px 'Archivo Variable', Arial, sans-serif`;
  };
  g.fillStyle = paper;
  g.fillRect(0, 0, W, H);

  // drafting grid
  g.strokeStyle = "rgba(17,18,20,0.06)";
  g.lineWidth = 1;
  for (let x = M; x <= W - M; x += 24) {
    g.beginPath();
    g.moveTo(x + 0.5, M);
    g.lineTo(x + 0.5, H - M);
    g.stroke();
  }
  for (let y = M; y <= H - M; y += 24) {
    g.beginPath();
    g.moveTo(M, y + 0.5);
    g.lineTo(W - M, y + 0.5);
    g.stroke();
  }
  g.strokeStyle = ink;
  g.lineWidth = 2;
  g.strokeRect(M, M, W - 2 * M, H - 2 * M);

  // header: name on a strip of tape
  g.fillStyle = tape;
  g.fillRect(M, M, W - 2 * M, 170);
  g.fillStyle = ink;
  font(150, 800, "extra-condensed");
  g.fillText(spec.name.toUpperCase(), M + 36, M + 148);
  font(22, 600);
  g.textAlign = "right";
  g.fillText(spec.type, W - M - 36, M + 56);
  g.fillText("ÉTABLI, Lyon", W - M - 36, M + 88);
  g.textAlign = "left";

  // render
  const iw = W - 2 * M - 80;
  const ih = (iw * image.height) / image.width;
  g.drawImage(image, M + 40, M + 210, iw, Math.min(ih, 860));
  font(16);

  // configuration table
  let y = M + 210 + Math.min(ih, 860) + 70;
  font(20);
  for (const [k, p] of Object.entries(spec.params)) {
    const v = cfg[k];
    const val = p.type === "num" ? `${v} ${p.unit}` : p.type === "material" ? MATERIALS[v].name : p.options.find((o) => o.id === v)?.label;
    g.fillStyle = dim;
    g.fillText(p.label, M + 40, y);
    g.fillStyle = ink;
    g.fillText(String(val), M + 420, y);
    g.strokeStyle = "rgba(17,18,20,0.2)";
    g.beginPath();
    g.moveTo(M + 40, y + 18);
    g.lineTo(W - M - 40, y + 18);
    g.stroke();
    y += 52;
  }

  // title block
  const bx = W - M - 520, by = H - M - 200;
  g.strokeStyle = ink;
  g.lineWidth = 2;
  g.strokeRect(bx, by, 520, 200);
  g.beginPath();
  g.moveTo(bx, by + 100);
  g.lineTo(bx + 520, by + 100);
  g.moveTo(bx + 260, by);
  g.lineTo(bx + 260, by + 200);
  g.stroke();
  font(16);
  const date = new Date().toISOString().slice(0, 10);
  const cells = [
    ["Drawn by", "You"],
    ["Date", date],
    ["Price", formatPrice(price)],
    ["Scale", "Not to scale"],
  ];
  cells.forEach(([a, b], i) => {
    const cx = bx + (i % 2) * 260 + 20, cy = by + Math.floor(i / 2) * 100 + 34;
    g.fillStyle = dim;
    g.fillText(a, cx, cy);
    g.fillStyle = ink;
    font(26, 600);
    g.fillText(b, cx, cy + 40);
    font(16);
  });

  const a = document.createElement("a");
  a.download = `etabli-${spec.slug}-${date}.png`;
  a.href = c.toDataURL("image/png");
  a.click();
}
