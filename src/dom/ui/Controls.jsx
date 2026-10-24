import { useConfig } from "../../store/useConfig";
import { useUI } from "../../store/useUI";
import { MATERIALS } from "../../data/materials";
import { sound } from "../../core/audio";
import { LineIcon } from "./LineIcon";
import { Swatch } from "./Swatch";
import { Odometer } from "./Odometer";

const fmt = (v) => String(Math.round(v));

function NumControl({ slug, k, p, value }) {
  const set = (v) => {
    const n = Math.min(p.max, Math.max(p.min, Math.round(v / p.step) * p.step));
    if (n === value) return;
    useConfig.getState().set(slug, k, n);
    sound("tick", (n - p.min) / (p.max - p.min));
  };
  const pct = ((value - p.min) / (p.max - p.min)) * 100;
  return (
    <div className="ctl ctl--num">
      <div className="ctl__value">
        <Odometer value={fmt(value)} className="t-display" />
        <span className="t-data t-dim">{p.unit}</span>
      </div>
      <div className="range" style={{ "--p": `${pct}%` }}>
        <button className="range__step" onClick={() => set(value - p.step * (p.int ? 1 : 10))} aria-label={`Decrease ${p.label}`} data-cursor="link">
          −
        </button>
        <div className="range__track">
          <input
            type="range"
            min={p.min}
            max={p.max}
            step={p.step}
            value={value}
            onChange={(e) => set(Number(e.target.value))}
            aria-label={p.label}
            aria-valuetext={`${value} ${p.unit}`}
            onPointerUp={() => useUI.getState().say(`${p.label} ${value} ${p.unit}`)}
          />
          <span className="range__fill" />
          <span className="range__ticks" />
        </div>
        <button className="range__step" onClick={() => set(value + p.step * (p.int ? 1 : 10))} aria-label={`Increase ${p.label}`} data-cursor="link">
          +
        </button>
      </div>
      <div className="ctl__scale t-data t-faint">
        <span>{p.min}</span>
        <span>{p.max}</span>
      </div>
    </div>
  );
}

function EnumControl({ slug, k, p, value }) {
  return (
    <div className="seg" role="radiogroup" aria-label={p.label}>
      {p.options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          className={`seg__opt ${value === o.id ? "is-active" : ""}`}
          onClick={() => {
            if (value === o.id) return;
            sound("click");
            useConfig.getState().set(slug, k, o.id);
            useUI.getState().say(`${p.label}: ${o.label}`);
          }}
          data-cursor="link"
        >
          <LineIcon id={o.id} />
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function MaterialControl({ slug, k, p, value }) {
  return (
    <div className="ctl ctl--mat">
      <div className="swatches">
        {p.options.map((id) => (
          <Swatch
            key={id}
            id={id}
            slug={slug}
            slot={p.slot}
            active={value === id}
            onApply={(mid, point) => {
              useConfig.getState().set(slug, k, mid, point);
              useUI.getState().say(`${p.label}: ${MATERIALS[mid].name}`);
            }}
          />
        ))}
      </div>
      <p className="ctl__note t-data">
        <span>{MATERIALS[value].name}</span>
        <span className="t-faint">{MATERIALS[value].card.note}</span>
      </p>
    </div>
  );
}

export function Controls({ slug, spec, cfg }) {
  return (
    <ol className="controls">
      {Object.entries(spec.params).map(([k, p]) => (
        <li key={k} className="controls__row">
          <h3 className="controls__label t-data">
            {p.label}
          </h3>
          {p.type === "num" && <NumControl slug={slug} k={k} p={p} value={cfg[k]} />}
          {(p.type === "enum" || p.type === "finish") && <EnumControl slug={slug} k={k} p={p} value={cfg[k]} />}
          {p.type === "material" && <MaterialControl slug={slug} k={k} p={p} value={cfg[k]} />}
        </li>
      ))}
    </ol>
  );
}
