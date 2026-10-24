import { MATERIALS } from "../../../data/materials";
import { formatPrice } from "../../../data/pricing";

/** Draws an A4 spec sheet (title block, render, configuration table) and downloads it as PNG. */
export function downloadSpecSheet({ spec, cfg, price, image }) {
  const W = 1240, H = 1754, M = 80;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  const ink = "#161614", dim = "#8a877e", pencil = "#ff4a1c", paper = "#eeebe4";
  g.fillStyle = paper;
  g.fillRect(0, 0, W, H);

  // drafting grid
  g.strokeStyle = "rgba(22,22,20,0.06)";
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

  // header
  g.fillStyle = ink;
  g.font = "italic 132px 'Instrument Serif', serif";
  g.fillText(spec.name, M + 40, M + 160);
  g.font = "500 20px 'Geist Mono Variable', monospace";
  g.fillStyle = dim;
  g.fillText(`N°${spec.no} — ${spec.type.toUpperCase()}`, M + 44, M + 60);
  g.fillStyle = pencil;
  g.fillText("ÉTABLI — DRAWN TO MEASURE", W - M - 360, M + 60);

  // render
  const iw = W - 2 * M - 80;
  const ih = (iw * image.height) / image.width;
  g.drawImage(image, M + 40, M + 210, iw, Math.min(ih, 860));

  // configuration table
  let y = M + 210 + Math.min(ih, 860) + 70;
  g.font = "500 18px 'Geist Mono Variable', monospace";
  let n = 1;
  for (const [k, p] of Object.entries(spec.params)) {
    const v = cfg[k];
    const val = p.type === "num" ? `${v} ${p.unit}` : p.type === "material" ? MATERIALS[v].name : p.options.find((o) => o.id === v)?.label;
    g.fillStyle = pencil;
    g.fillText(String(n++).padStart(2, "0"), M + 40, y);
    g.fillStyle = dim;
    g.fillText(p.label.toUpperCase(), M + 100, y);
    g.fillStyle = ink;
    g.fillText(String(val).toUpperCase(), M + 460, y);
    g.strokeStyle = "rgba(22,22,20,0.2)";
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
  g.font = "500 15px 'Geist Mono Variable', monospace";
  const date = new Date().toISOString().slice(0, 10);
  const cells = [
    ["DRAWN BY", "YOU"],
    ["DATE", date],
    ["PRICE", formatPrice(price)],
    ["SCALE", "NTS"],
  ];
  cells.forEach(([a, b], i) => {
    const cx = bx + (i % 2) * 260 + 20, cy = by + Math.floor(i / 2) * 100 + 34;
    g.fillStyle = dim;
    g.fillText(a, cx, cy);
    g.fillStyle = ink;
    g.font = "500 24px 'Geist Mono Variable', monospace";
    g.fillText(b, cx, cy + 40);
    g.font = "500 15px 'Geist Mono Variable', monospace";
  });

  const a = document.createElement("a");
  a.download = `etabli-${spec.slug}-${date}.png`;
  a.href = c.toDataURL("image/png");
  a.click();
}
