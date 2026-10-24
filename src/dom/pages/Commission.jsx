import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { usePage } from "./usePage";
import { useCart } from "../../store/useCart";
import { useUI } from "../../store/useUI";
import { encodeConfig } from "../../store/useConfig";
import { formatPrice } from "../../data/pricing";
import { SLUGS } from "../../data/catalog";
import { sound } from "../../core/audio";
import { rigs, cam } from "../../webgl/rigs";
import { claim } from "./scene";
import { TLink } from "../ui/TLink";
import { Odometer } from "../ui/Odometer";

const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

function Item({ item }) {
  const ref = useRef(null);
  const q = `/objects/${item.slug}${encodeConfig(item.slug, item.config) ? `?${encodeConfig(item.slug, item.config)}` : ""}`;

  const remove = () => {
    sound("scratch", 0.5);
    gsap
      .timeline({ onComplete: () => useCart.getState().remove(item.id) })
      .to(ref.current, { x: 24, rotate: 1.2, autoAlpha: 0, duration: 0.45, ease: "power3.in" })
      .to(ref.current, { height: 0, paddingTop: 0, paddingBottom: 0, borderWidth: 0, duration: 0.4, ease: "expo.inOut" });
    useUI.getState().say(`${item.name} removed`);
  };

  return (
    <li ref={ref} className="item" style={{ overflow: "hidden" }}>
      <img className="item__thumb" src={item.thumb} alt={`${item.name}, as configured`} width="132" height="99" />
      <div className="item__body">
        <p className="item__title">
          <span className="t-display">{item.name}</span>
          <span className="t-mono t-dim">
            N°{item.no} — {item.type}
          </span>
        </p>
        <p className="item__summary t-mono t-dim">{item.summary}</p>
        <div className="item__actions t-mono">
          <TLink to={q} className="link-btn" data-cursor="link">
            Edit
          </TLink>
          <button className="link-btn" onClick={remove} data-cursor="link">
            Remove
          </button>
        </div>
      </div>
      <div className="item__right">
        <Odometer value={formatPrice(item.price * item.qty)} className="item__price t-display" />
        <div className="qty t-mono" role="group" aria-label={`Quantity of ${item.name}`}>
          <button onClick={() => (sound("tick", 0.3), useCart.getState().qty(item.id, item.qty - 1))} aria-label="One less" data-cursor="link">
            −
          </button>
          <span aria-live="polite">{item.qty}</span>
          <button onClick={() => (sound("tick", 0.6), useCart.getState().qty(item.id, item.qty + 1))} aria-label="One more" data-cursor="link">
            +
          </button>
        </div>
      </div>
    </li>
  );
}

export default function Commission() {
  const ref = useRef(null);
  const ticket = useRef(null);
  const stamp = useRef(null);
  const items = useCart((s) => s.items);
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(false);
  const total = items.reduce((n, i) => n + i.price * i.qty, 0);
  const count = items.reduce((n, i) => n + i.qty, 0);
  usePage(ref, { index: "03", label: "COMMISSION", title: "Your commission — ÉTABLI" });

  // nothing on stage here: objects fold back into lines and leave
  useLayoutEffect(() => {
    claim();
    for (const s of SLUGS) {
      const r = rigs[s];
      if (r.visible) gsap.to(r, { sweep: 0, line: 0, duration: 0.7, ease: "power2.in", onComplete: () => (r.visible = 0) });
    }
    gsap.to(cam, { x: 0, y: 1.1, z: 6, tx: 0, ty: 0.45, tz: 0, fov: 28, orbit: 0, duration: 1 });
    gsap.fromTo(
      ref.current.querySelectorAll(".commission__reveal"),
      { autoAlpha: 0, y: 40, rotate: 0.6 },
      { autoAlpha: 1, y: 0, rotate: 0, duration: 1.1, stagger: 0.1, ease: "expo.out", delay: 0.2 }
    );
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (busy || !items.length) return;
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const no = String(Math.floor(1000 + Math.random() * 9000));
    setBusy(true);
    gsap
      .timeline()
      .fromTo(stamp.current, { autoAlpha: 0, scale: 2.6, rotate: -24 }, { autoAlpha: 1, scale: 1, rotate: -12, duration: 0.32, ease: "power4.in" })
      .add(() => sound("stamp"))
      .fromTo(ticket.current, { x: 0 }, { x: 3, duration: 0.05, repeat: 3, yoyo: true, ease: "none" })
      .to(ticket.current, { y: -60, rotate: -2.5, autoAlpha: 0, duration: 0.8, ease: "power3.in", delay: 1.1 })
      .add(() => {
        setSent({ no, name: String(data.name || "").split(" ")[0], email: data.email, count, total });
        useCart.getState().clear();
        setBusy(false);
        useUI.getState().say(`Request ${no} received`);
        sound("chime");
      });
  };

  useLayoutEffect(() => {
    if (sent) gsap.fromTo(ref.current.querySelectorAll(".received > *"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: "expo.out" });
  }, [sent]);

  if (sent) {
    return (
      <div ref={ref} className="page commission pad">
        <div className="received">
          <p className="kicker t-mono">
            <span>Request N°{sent.no} — Received</span>
          </p>
          <h1 className="t-display t-h2">
            Thank you{sent.name ? `, ${sent.name}` : ""}. <em>We’ll draw it.</em>
          </h1>
          <p className="t-body t-dim">
            {sent.count} object{sent.count > 1 ? "s" : ""}, {formatPrice(sent.total)}. An atelier drawing will reach {sent.email || "you"} within two working days. Nothing has been charged.
          </p>
          <TLink to="/objects" className="btn btn--primary" data-cursor="link">
            <span>Back to the collection</span>
            <span aria-hidden="true">→</span>
          </TLink>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="page commission pad">
      <div className="ticket-wrap">
        <article ref={ticket} className="ticket commission__reveal" aria-label="Commission ticket">
          <span ref={stamp} className="stamp" aria-hidden="true">
            Received
          </span>
          <header className="ticket__head">
            <div>
              <p className="t-mono t-dim">Workshop order — {today()}</p>
              <h1 className="t-display t-h3">Your commission</h1>
            </div>
            <p className="t-mono">
              <span className="t-pencil">
                <Odometer value={String(count).padStart(2, "0")} />
              </span>{" "}
              items
            </p>
          </header>

          {items.length ? (
            <>
              <ul className="ticket__items">
                {items.map((i) => (
                  <Item key={i.id} item={i} />
                ))}
              </ul>
              <div className="ticket__total">
                <span className="t-mono t-dim">Total, before delivery</span>
                <Odometer value={formatPrice(total)} className="t-display" />
              </div>
            </>
          ) : (
            <div className="ticket__empty">
              <p className="t-display t-h3">Nothing on the bench yet.</p>
              <p className="t-body t-dim">Choose an object, set its measurements and add it here.</p>
              <TLink to="/objects" className="btn btn--ghost" data-cursor="link">
                Browse the collection →
              </TLink>
            </div>
          )}
        </article>

        <aside className="request commission__reveal">
          <p className="kicker t-mono">
            <span>Request</span>
          </p>
          <h2 className="t-display t-h3">
            Send it to <em>the atelier.</em>
          </h2>
          <form onSubmit={submit}>
            <label className="field">
              <span className="t-mono t-dim">Name</span>
              <input className="field__input" name="name" autoComplete="name" required placeholder="Your name" />
            </label>
            <label className="field">
              <span className="t-mono t-dim">Email</span>
              <input className="field__input" name="email" type="email" autoComplete="email" required placeholder="you@studio.com" />
            </label>
            <label className="field">
              <span className="t-mono t-dim">Notes</span>
              <textarea className="field__input" name="notes" placeholder="Room, stairs, a deadline…" />
            </label>
            <button className="btn btn--primary" type="submit" disabled={!items.length || busy} data-cursor="link">
              <span>Request commission</span>
              <span aria-hidden="true">→</span>
            </button>
            <p className="request__legal t-mono t-faint">A request, not an order. No payment is taken.</p>
          </form>
        </aside>
      </div>
    </div>
  );
}
