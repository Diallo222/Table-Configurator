# ÉTABLI — *Drawn to measure.*

> Creative concept for the total redesign of the Table Configurator.
> Status: **v1 draft** · Date: 2026-10-19 · Companion doc: [`PLAN.md`](./PLAN.md)

---

## 0. TL;DR

The old site is a single table on a grey background with a side panel of controls. The new site is **ÉTABLI**, a fictional furniture house (*établi* is French for *workbench*, and also means *established*). It sells a small collection of six configurable objects.

The whole site runs on one idea:

> **Every object begins as a line.**

Each piece of furniture has two states. One is a **technical drawing**: graphite edges, dimension lines, hatching and a drafting grid. The other is the **real, material object**: oak, travertine, powder-coated steel. The site constantly moves between the two. You load into a drawing, scroll and watch drawings turn into matter, hover with an X-ray lens that shows the drawing under the object, and configure by **grabbing the dimension lines themselves**.

The configurator stops being a side panel and becomes the main event: a drafting table where you *draw* your furniture to measure.

---

## 1. Why this direction

Three directions were weighed. Only the winner is developed below.

| Direction | Idea | Verdict |
|---|---|---|
| **A. "Drawn to measure"** (blueprint ⇄ matter) | Objects move between technical drawing and photoreal material. Configuration means drafting. | ✅ **Chosen.** The concept *is* the configurator: measuring, specifying and drafting are what you do when you configure. Every effect has a functional reason, which is what separates award work from a demo reel. |
| B. Infinite museum | Objects on plinths in an endless gallery you wander through | Beautiful but generic. Lusion, Cartier and Immersive Garden have done it at a level that's hard to beat. Weak link to configuration. |
| C. Light & shadow | Cursor is a light source and objects are revealed by their shadows | Strong mood, but it fights legibility of the products. Its best part survives in A as **night mode** (§6.6). |

What the 2026 award winners have in common ([research §12](#12-research--references)):
- **One object treated with great seriousness** (Lusion's *Oryzo* sells a cork coaster like an iPhone).
- **One scroll source of truth** that drives DOM and WebGL in the same frame (Haoqi, Trionn, Shader.se).
- **Signature transitions built from render targets**: scenes sample each other's textures (Shader.se).
- **DOM for text, WebGL for matter**, synchronized, with `mix-blend-mode` keeping text readable over the canvas.
- **Generative sound** that reads the same numbers as the visuals (Trionn, *Volatile Nexus*).
- **Restraint**: one idea, many variations, not twenty unrelated effects.

ÉTABLI follows all six.

---

## 2. Brand

| | |
|---|---|
| **Name** | ÉTABLI (placeholder, easy to rename) |
| **Tagline** | *Drawn to measure.* |
| **What it is** | A fictional atelier making six made-to-measure objects. **Collection 01.** |
| **Voice** | Calm and precise, like an architect's notes with a little wit. Short sentences. Numbers in millimetres. Annotations instead of marketing copy. |
| **Sample copy** | "Every object begins as a line." / "1 840 mm of solid oak. Yours to measure." / "We don't do sizes. We do measurements." / 404: "Off the plan." |

### 2.1 Collection 01: the six objects

Each object shows off one distinct configurator ability, so no two product pages feel the same.

| # | Object | Type | Hero configurator ability | Asset source |
|---|---|---|---|---|
| 01 | **ATLAS** | Dining table | **Drag-to-measure** width and depth with 9-slice stretching (no distorted bevels), 3 base styles, top material | Existing `Table.gltf` (re-exported) |
| 02 | **MIRA** | Lounge chair | **Upholstery ink-bleed**: drag fabric swatches onto the seat, frame wood separate | Poly Haven `mid_century_lounge_chair` / Blender |
| 03 | **ORBIT** | Articulated desk lamp | **Direct manipulation**: grab the lamp head and pose the arm (2-bone IK). Colour temperature 2700–4000 K. **Turns the site to night.** | Poly Haven `desk_lamp_arm_01` (rigged) |
| 04 | **TRIPOD** | Stool | **Height** 450–800 mm (counter, bar, high) with leg-splay recompute, seat shape | Poly Haven `wooden_stool_02` / Blender |
| 05 | **GRID** | Modular shelving | **Procedural generation**: drag edges to add columns and rows, and modules pop in drawn-then-filled | 100% procedural (no model) |
| 06 | **SLAB** | Side / coffee table | **Stone**: travertine, marble or terrazzo top with a polished vs honed finish (light-sweep highlight) | Poly Haven `modern_coffee_table_01` / Blender |

All Poly Haven assets are CC0. Materials come from the Poly Haven veneer and stone texture library (walnut, oak, ash and cherry veneers…).

---

## 3. Art direction

### 3.1 Mood

The workshop floor, not the drawing office. Primer-grey sheets, graphite, and the yellow of a tape measure. Lumber stamps, stencilled crate markings, assembly-drawing balloons. Daylight by default; at night the shop goes graphite and the lamp is the light source.

> **Revised 2026-10-24.** The first direction (bone paper, serif display with italic accent words, one vermilion accent, mono uppercase eyebrows, § section numbers, glass panels, grain) matched the generic "AI editorial" look almost exactly. It was replaced with a direction taken from the product itself: things that are measured.

### 3.2 Palette (design tokens)

| Token | Day (default) | Night | Use |
|---|---|---|---|
| `--paper` | `#E7E8E4` | `#111214` | Page background (cool primer grey, never cream) |
| `--paper-2` | `#DADBD6` | `#1A1C1F` | Wells, section grid, hover rows |
| `--ink` | `#111214` | `#E7E8E4` | Text, drawing lines, borders |
| `--ink-2` / `--ink-3` | `#4B4E52` / `#85888C` | `#A3A6A9` / `#6B6E72` | Secondary / tertiary text |
| `--accent` | `#F4C20D` | `#FFCD1F` | **Tape yellow.** Always a fill with ink on top, never text on grey |

Rule: **yellow means "measured or editable right now"**: range tape, dimension handles, live counts, the transition tape, the sweep line. It never decorates.

### 3.3 Typography

One family, **Archivo** (variable weight + width), self-hosted.

| Role | Setting | Notes |
|---|---|---|
| Display | 800 weight, 62 % width, uppercase | Stencil / timber-stamp feel. No italics, no accent word |
| Text / UI | 400–600 weight, 100 % width | 13–17 px |
| Data | 500 weight, 86 % width, tabular figures | Every number, dimension and price. Sentence case, no zero padding |

### 3.3b Things we don't do

Eyebrow labels with rules, § numbering, "N°" meta strings, 01/02 numbering on non-sequences, arrows on every link, coloured left borders, glass blur, pills, grain, crop marks, em-dash copy. Numbers appear only where they count something real (1 / 6, process steps, drawing balloons).

### 3.4 Interface chrome: "the drafting table"

The viewport is framed like CAD software or a drafting sheet. This is the most recognisable visual signature after the blueprint effect.

```
┌─┬────────────────────────────────────────────────────────────────┬──────┐
│ │ 0    100    200    300  ▼  400    500    600    700    800  mm  │      │  ← top ruler (cursor marker ▼)
├─┼────────────────────────────────────────────────────────────────┴──────┤
│1│ ÉTABLI®                         Objects   Atelier   Commission (02) ● │  ← ● = sound toggle
│0│                                                                       │
│0│                                                                       │
│ │                                                                       │
│2│                    [  3D CANVAS — full bleed  ]                       │
│0│                                                                       │
│0▶                                                                       │  ← left ruler (cursor marker ▶)
│ │                                                                       │
│3│ X 0412  Y 0208                                 §03 — COLLECTION  42%  │  ← live coords · section · progress
└─┴───────────────────────────────────────────────────────────────────────┘
   + corner crop marks, film-grain paper texture, faint 8 mm drafting grid
```

- **Rulers** (top and left, 20 px) tick in "millimetres". They show cursor position markers and scroll with the page. On the configurator they **snap to the object's real dimensions**.
- **Live coordinates** bottom-left, section index and scroll progress bottom-right, all in Geist Mono.
- **Annotations**: numbered callouts (`01`, `02`…) whose SVG leader lines connect DOM labels to points on the 3D object. They are re-projected every frame, so they stay attached as the camera moves.
- **Grain**: a subtle animated paper-noise overlay (post-processing on the canvas, CSS on the DOM).

### 3.5 Motion principles

1. **Draw, then fill.** Everything appears first as an outline, then gains matter: buttons (stroke draws, then fill wipes), images (frame draws, then image unmasks), 3D objects (lines, then material sweep). This is the site's motion grammar.
2. **Weight.** Objects are heavy. Camera moves have inertia, things settle with a tiny overshoot, and nothing bounces.
3. **Precision.** Numbers never fade. They **roll** (odometer) or **scramble** (mono glyph scramble) to their value.
4. **One clock.** Scroll, GSAP and WebGL tick in the same frame. No drifting layers.

| Token | Value |
|---|---|
| `ease.draw` | `power2.inOut` (lines) |
| `ease.fill` | `CustomEase "0.7,0,0.2,1"` (matter, panels) |
| `ease.settle` | `CustomEase` with ~2% overshoot (objects landing) |
| `dur.micro` | 0.25 s (hover, toggles) |
| `dur.ui` | 0.6 s (panels, text reveals) |
| `dur.scene` | 1.4–2.2 s (sweeps, camera flights) |

### 3.6 Custom cursor

A **drafting crosshair** (thin + with a small circle) with a mono readout. It changes state by context:

| Context | Cursor |
|---|---|
| Default | Crosshair + `X/Y` |
| Over 3D object | Circle grows into the **X-ray lens** (§5.2) |
| Over a dimension handle | `⟷ 1 840` with live value |
| Dragging a swatch | Swatch chip follows with lag; `DROP` label over a valid part |
| Over a link / product | Fills vermilion: `OPEN` / `VIEW` |
| Rotating the object | `↻ 32°` |

Buttons are magnetic (10–14 px pull).

---

## 4. Signature effects

These are the five moments people will screen-record. Each is reused across the site so the experience stays coherent.

### 4.1 The Drafting Sweep (blueprint → matter)

A horizontal (or object-aligned) **cutting plane** passes through the object. Behind it the object is a line drawing. In front of it the object is real material. Right at the plane:
- a glowing **vermilion scan line** follows the object's silhouette,
- **graphite dust** particles shed off the boundary and drift away on curl noise,
- dimension annotations for the region just materialised tick in.

**Used for:** loader handoff, product reveal, variant switches (leg style A → B: old dematerialises, new materialises), route transitions, collection scroll.

### 4.2 The X-ray Lens

Over any object, the cursor becomes a soft-edged circular lens. **Inside it you see the technical drawing of what's under it**: edges, hidden structure, joinery, dimensions. The edge of the lens wobbles slightly (noise) and has a thin vermilion rim.
- **Press and hold** and the lens grows to fill the screen, switching the configurator to **Plan mode**. Release to return. One gesture with a functional result.
- On touch devices: long-press.

### 4.3 Drag-to-Measure

Dimension lines float around the object in the configurator, in the same style as the drawing. **You grab the arrows and pull.** The table grows in real time:
- the top stretches with **9-slice vertex stretching** (bevels and rounded corners keep their exact size, unlike the old site's naive `scale.x`),
- legs and stretchers reposition,
- the rulers in the chrome re-scale to match,
- values snap every 10 mm with a soft tick (sound + `navigator.vibrate` on mobile),
- price rolls up or down live.

### 4.4 Ink-Bleed Materials

Material swatches are small physical samples (rendered chips) in a material tray. **Drag a swatch onto any part of the object.** On drop, the new material **bleeds outward from the exact drop point** across that part, like ink soaking into paper: a noisy radial front with a thin darkened wet edge. Clicking a swatch also works (the bleed starts from the part's centre).

### 4.5 Day → Night

The ORBIT lamp's page and the home "Atelier" chapter **switch on the lamp**. The site goes dark through a radial wipe expanding from the bulb:
- the paper palette flips to night tokens (CSS variables tweened),
- the 3D scene drops ambient light, the lamp becomes a real light source, and bloom wakes up,
- the drawing lines become bone-on-graphite.

Night mode stays as a persistent toggle (the bulb icon in the header).

---

## 5. Site map & experience

```
/                    Home: the scroll story (7 chapters)
/objects             The Index: the collection (Studio grid ⇄ Plan archive)
/objects/:slug       The Workbench: the configurator (one per object)
/commission          The Ticket: cart → request a commission
/atelier             (optional, phase 2) process & joinery
*                    404: "Off the plan."
```

One **persistent WebGL canvas** lives behind every route and is never unmounted. DOM pages change on top of it, so objects can fly between pages without reloading.

### 5.1 Loader: "Drafting"

1. Bone paper and a faint grid. A pencil line **draws the ÉTABLI wordmark** (SVG `DrawSVG`) and then **the silhouette of ATLAS** in orthographic front view.
2. Loading progress is the line length, with a mono counter reading `0000 → 1840 mm` instead of `0 → 100%`.
3. On load, the 2D SVG drawing is **replaced pixel-perfectly** by the 3D blueprint version of the table (same projection), with no visible swap.
4. The camera slowly rotates from orthographic front into 3/4 perspective, then the **Drafting Sweep** materialises the table in oak.
5. The headline arrives letter by letter (blur → sharp, random order): ***Drawn to measure.***

### 5.2 Home: the scroll story

| § | Chapter | What happens |
|---|---|---|
| 01 | **Hero** | ATLAS on a monolithic plinth in a soft cyclorama. Giant serif headline, with the table *breaking through* the type (DOM text in front and behind via two layers). **X-ray lens** on hover. Slow inertial rotation following the mouse. |
| 02 | **The Line** (manifesto) | Pinned. Scroll scrubs the table into an **exploded axonometric view**: top lifts, legs separate, bolts float out, each part with leader-line annotations (`01 TOP — Solid oak 32 mm`, `02 BASE — Powder-coated steel`). Manifesto lines reveal masked, line by line. |
| 03 | **Collection 01** | Pinned horizontal sequence. Six plinths slide past and each object **sweeps from drawing into matter** as it reaches centre, tied to scroll progress (scrub forward and back). The giant name changes with a vertical mask roll. Click → Workbench. |
| 04 | **Measure** | The table from §01 returns in **Plan view** (top-down drawing). Scrolling stretches it from 700 to 2 400 mm. The rulers re-scale, the counter rolls, and seating-count icons (2 → 10 chairs) draw in around it. Shows "made to measure" without a word. |
| 05 | **Material Library** | Interactive playground: a sample block or TRIPOD stool plus a tray of 8 swatches. **Drag swatches onto it** for the ink-bleed. Each swatch has a mono spec card (origin, hardness, finish). |
| 06 | **The Atelier** | Process in four steps: *Sketch → Joinery → Finish → Delivered*. Joinery shows a dovetail or mortise animation (two parts sliding together). At the end, the ORBIT lamp lowers into frame, **clicks on**, and the site **turns to night**. |
| 07 | **Footer** | The giant ÉTABLI wordmark is drawn in outline and fills when hovered letter by letter. CTA: *Start a commission →*. Credits, sound toggle, "back to top" (fast camera rewind of the whole story). |

### 5.3 The Index (`/objects`)

Two views of the same collection, toggled by a segmented control:
- **Studio**: a 3×2 grid of live 3D cards (one canvas via drei `<View>` scissoring). Each object sits on its own mini plinth, idles slowly, and rotates toward the cursor on hover. The cursor reads `OPEN`.
- **Plan**: a Swiss-style archive list. Each row is a *top-down technical drawing* of the object, with name, type, dimension range, materials count and "from" price in mono. Hover sweeps the row from drawing to colour thumbnail.

Switching views uses **GSAP Flip**: cards morph into rows. Category filters (Seating / Tables / Light / Storage) reflow with Flip too.

**Into a product:** the clicked card's object **flies out of its card** into the centre of the full screen. Its plinth rises from the floor, the other cards fall away with stagger, and the Workbench UI draws in around it.

### 5.4 The Workbench (`/objects/:slug`)

The heart of the site. Full-screen and immersive. The UI looks like a spec sheet pinned to a drafting table.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Index        ATLAS — Dining table          [Studio|Plan|Room]  ◐  (02) │
│                                                                          │
│  N°01                          ⟵——— 1 840 mm ———⟶       ┌──────────────┐ │
│  ATLAS                       ┌───────────────────────┐   │ 01 BASE      │ │
│  Dining table                │                       │   │ ▢ Trestle    │ │
│                              │   3D OBJECT ON PLINTH │ ↕ │ ▣ Splay      │ │
│  "A long table for           │   (drag to rotate,    │ 9 │ ▢ Arc        │ │
│   long dinners."             │    grab dims to       │ 0 │──────────────│ │
│                              │    measure)           │ 0 │ 02 TOP       │ │
│  € 3 480 ▲ (rolling)         └───────────────────────┘   │ ● ● ● ● ○    │ │
│                                                          │ 03 BASE TINT │ │
│  ◦ Seats 8                                               │ ● ● ● ●      │ │
│  ◦ Lead time 6 wks                                       │ 04 FINISH    │ │
│                                                          │ Matte|Satin  │ │
│  [ Spec sheet ↓ ]  [ Share ⧉ ]                           └──────────────┘ │
│                                        [  Add to commission  →  ]        │
│ X 0412  Y 0208          ‹ 06 SLAB             TRIPOD 04 ›         §01/06 │
└──────────────────────────────────────────────────────────────────────────┘
```

**Modes** (top-right segmented control, or hold the X-ray lens):
- **Studio**: photoreal on plinth. Free rotate with inertia, limited polar angle. Dimension handles visible on hover.
- **Plan**: the camera tweens to near-orthographic views (front / side / top, cycled by arrows). Everything becomes the drawing, with full dimensioning. Values are editable inline by typing.
- **Room** (stretch): the object is placed in a minimal, art-directed room vignette (rug, wall, window light) for scale. Optional **AR** on mobile via `<model-viewer>` / WebXR with the current configuration exported to glTF.

**Controls**, always mirrored in an accessible DOM panel:
- **Dimensions**: drag handles in 3D (§4.3), plus mono inputs and ±10 mm steppers.
- **Variants** (base style, seat shape…): small *line-drawing* icons that animate on hover. Switching plays a mini Drafting Sweep, old out and new in.
- **Materials**: swatch tray, with drag-and-drop ink-bleed (§4.4) or click.
- **Finish**: matte / satin / gloss. Changes roughness and clearcoat, with a light-sweep highlight across the surface to show the difference.
- **Object-specific**: ORBIT has arm posing (grab the head) and Kelvin. GRID has edge handles that add or remove columns and rows.

**Price** rolls like an odometer on every change. A small "Δ +€140" ghost floats up and fades.

**Next / previous object** (bottom): the current object **dematerialises into lines**, the camera dollies sideways along an invisible rail, and the next one materialises. URL updates.

**Spec sheet ↓**: generates a beautiful **A4 PNG/PDF poster**: front, side and top drawings, the 3/4 render, configuration table, an ÉTABLI title block (date, ref no., "Drawn by: you"). Built from offscreen renders.

**Share ⧉**: the configuration is encoded in the URL (`/objects/atlas?w=1840&d=900&base=splay&top=walnut…`), so a link reproduces it exactly.

### 5.5 The Ticket (`/commission`)

The cart is styled as a **workshop order ticket**: perforated edge, carbon-copy feel, stamped ref number.
- **Add to commission animation**: a line-drawn crate **folds up around the object** (the object shrinks into it), the crate is stamped `N° 0042`, and it flies into the header's Commission counter with Flip. The counter increments with a roll.
- Each line item thumbnail is a **snapshot render of that exact configuration**, not a stock image.
- Checkout is a **"Request commission"** form (name, email, notes). This is a portfolio piece, so **no payment fields and no real transaction**. On submit, the ticket gets a vermilion "RECEIVED" stamp with a slam animation and is torn off.

### 5.6 404: "Off the plan"

A blueprint of a chair with one leg missing, drawn in. The leg is draggable, and snapping it into place redirects home.

---

## 6. Transitions (route choreography)

| From → To | Choreography |
|---|---|
| Any → Any (default) | **Line wipe**: a vermilion pencil line draws across the screen, a paper panel follows it, the page swaps, and the panel exits the other side. Canvas content transitions on its own underneath. |
| Home §03 / Index → Workbench | **Object flight**: the object leaves its card or plinth, the camera flies, the plinth rises, and the UI draws in. No wipe, the object *is* the transition. |
| Workbench → Workbench | **Dematerialise → rail dolly → materialise.** |
| Workbench → Index | Reverse flight: the object shrinks back into its card slot while the other cards rise in. |
| Any → Commission | The ticket slides up from the bottom like paper from a printer (with a slight curl). |
| Day ⇄ Night | Radial wipe from the light source (or from the toggle button). |

All route transitions finish in **≤ 1.6 s** and can be interrupted. A click mid-transition fast-forwards it.

---

## 7. Sound (optional, off by default)

Generative Web Audio, quiet and tactile, never music for its own sake.

| Event | Sound |
|---|---|
| Line drawing (loader, sweeps) | Soft pencil scratch, filtered noise whose gain follows line speed |
| Dimension snap (each 10 mm) | Tiny wooden tick, pitch rising with size |
| Swatch drop | Soft "pat" + liquid bleed swell |
| Object lands on plinth | Low wood knock |
| Lamp on | Switch click + warm hum swell |
| Ticket stamp | Rubber-stamp thump |

The toggle is the `●` in the header, persisted per visitor. Sound reads the same values as the visuals (sweep speed, drag velocity), so audio and image never disagree.

---

## 8. Accessibility & inclusivity

- **Everything configurable without WebGL interaction**: the DOM panel mirrors every 3D control (keyboard, screen reader). 3D handles are a shortcut, never the only path.
- `aria-live` announcements: *"Width 1 840 millimetres. Price 3 480 euros."*
- **`prefers-reduced-motion`**: no Lenis smoothing, no camera flights (instant cuts with a crossfade), sweeps become 300 ms fades, no dust particles or grain animation.
- **No-WebGL / low-tier fallback**: pre-rendered stills and turntable sprites per object, with the configurator still usable via the DOM panel.
- Contrast: ink on paper ≥ 12:1, vermilion used only with ink text or as non-text indicator.
- Sound off by default. Every hover-only feature has a focus or tap equivalent.

---

## 9. Responsive strategy

| | Desktop | Tablet | Mobile |
|---|---|---|---|
| Rulers | Top + left | Top only | Hidden (coords hidden too) |
| X-ray lens | Hover + hold | Long-press | Long-press |
| Collection §03 | Pinned horizontal | Pinned horizontal | Vertical stack, one per screen, swipe |
| Workbench panel | Right column | Bottom sheet | Bottom sheet with drag-to-expand snap points |
| Dimension handles | Fine | Larger hit areas (44 px) | Larger hit areas + stepper fallback |
| Effects | Full | Reduced dust & DPR | Tiered by GPU (no SSAO, lower DPR, fewer particles) |

---

## 10. Technical direction (summary; details in PLAN.md)

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite 6 + React 19** (keep) | Canvas-heavy SPA. Persistent canvas is simpler without SSR. |
| 3D | **three r186 + @react-three/fiber 9.8 + drei 10.7** | Stable line. R3F v10 / WebGPU is still alpha: revisit later. |
| Shaders | **GLSL + `three-custom-shader-material`** to extend `MeshPhysicalMaterial` | Keep PBR lighting and inject sweep, stretch and ink-bleed logic |
| Post | **`postprocessing` 6 / `@react-three/postprocessing` 3.2** + custom `Effect`s | Lens composite, edge detection, grain, AgX tone mapping, bloom |
| Motion | **GSAP 3.15** (ScrollTrigger, SplitText, Flip, DrawSVG, CustomEase, ScrambleText, Draggable, Inertia: all free now) + `@gsap/react` | Industry standard. Timelines drive shader uniforms directly. |
| Scroll | **Lenis 1.3** | Smooth scroll, single source of truth |
| Clock | **One master loop**: `gsap.ticker` → `lenis.raf` → R3F `advance()` (`frameloop="never"`) | Removes the one-frame DOM/WebGL lag seen in many sites |
| State | **zustand 5** (config, cart, UI, sound) + URL sync | Already in use |
| Routing | **react-router 7** (keep) + custom transition manager | Holds navigation until the out-animation finishes |
| Assets | Blender → glTF → `gltf-transform` (Meshopt + KTX2) → `gltfjsx` | Small, fast, GPU-compressed |
| Audio | Web Audio API (generated + 2–3 tiny samples) | No heavy audio files |

WebGPU/TSL is deliberately **not** the base: the pmndrs post-processing stack and several drei materials are WebGL-only, and some drei materials broke with three ≥ 0.180 ([forum](https://discourse.threejs.org/t/drei-meshtransmissionmaterial-webgpu/87427)). Shaders are written so they can be ported to TSL later.

---

## 11. Success criteria

- Feels like **one idea, deeply executed**, not a demo reel.
- Every effect has a **functional purpose** (lens shows structure, sweep shows variant change, drag-to-measure *is* configuring, ink-bleed *is* applying material).
- **60 fps** on a mid-range laptop, **≥ 45 fps** on a mid-range phone, first interaction **< 3 s** on desktop broadband.
- Fully configurable by **keyboard and screen reader**.
- Submission-ready for **Awwwards SOTD / FWA / CSSDA** (design, usability, creativity, content all considered).

---

## 12. Research & references

**Case studies read for this concept**
- Shader.se: scroll-driven render pipeline, per-scene FBOs, scene-to-scene texture sampling, frustum-matched plane transitions. [Codrops, May 2026](https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/)
- Trionn: coordinating GSAP + Three.js + Lenis + Web Audio, a single `explodeAmt` value driven by every interaction, `BlurTextReveal` with SplitText, `gsap.matchMedia`. [Codrops, Jul 2026](https://tympanus.net/codrops/?p=117096)
- Haoqi Design: DOM and WebGL sharing one frame, Lenis driven from R3F so scroll and render agree. [Codrops, Aug 2026](https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/)
- Datamosh scene transitions via ping-pong history buffers. [Codrops, Sep 2026](https://tympanus.net/codrops/2026/09/02/breaking-the-frame-building-a-real-time-datamosh-effect-with-three-js/)
- Crumpled paper with Houdini VAT: baked sims played back interactively. [Codrops, Sep 2026](https://tympanus.net/codrops/2026/09/19/crumbled-paper-houdini-vat-threejs/)
- *Volatile Nexus*: glass, caustics, ripple impulses in `positionNode`, and sound driven by the same field energy. [Codrops, Aug 2026](https://tympanus.net/codrops/2026/08/31/volatile-nexus-tinkering-with-glass-caustics-cubes-and-sound-in-three-js/)
- Interactive 3D cluster with TSL + dithering post. [Codrops, Aug 2026](https://tympanus.net/codrops/2026/08/12/creating-an-interactive-3d-cluster-with-three-js-tsl-and-three-start/)
- Lusion studio spotlight (*Oryzo*: one absurd object, treated with real craft). [Codrops, Apr 2026](https://tympanus.net/codrops/2026/04/13/lusion-where-digital-craft-meets-ambitious-experimentation/)
- Dissolve effect with shaders and particles. [Codrops](https://tympanus.net/codrops/?p=86603)
- Refraction through a glass torus with drei `MeshTransmissionMaterial`. [Codrops](https://tympanus.net/codrops/?p=89382)

**Showcases**
- Best Three.js websites 2026 (Oryzo, IVRESS, Hubtown, Cartier Watches & Wonders, Primland…). [Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026)
- Awwwards configurator inspiration: [Copentek 3D Product Configurator](https://www.awwwards.com/inspiration/3d-product-configurator-copentek-website), [Generative 3D-Configurator](https://www.awwwards.com/sites/generative-3d-configurator), [Interactive exploded view (IYO)](https://www.awwwards.com/inspiration/interactive-webgl-exploded-view-iyo), [Lyon Béton configurator](https://www.awwwards.com/inspiration/configurator-lyon-beton), [Schrankwerk](https://www.awwwards.com/inspiration/the-configurator-in-action-schrankwerk)
- Web 3D configurators ranked, 2026. [interact.gallery](https://www.interact.gallery/blog/top-10-web-3d-configurators-2026)
- Editorial furniture hero (object breaking through display type). [Converge template](https://enter.converge.ai/marketplace/templates/d798a9eb55434d3397c7cacf295f5634)

**Tech notes**
- Lenis + GSAP ticker wiring (`lagSmoothing(0)`, `time * 1000`). [Lenis README](https://cdn.jsdelivr.net/npm/lenis@1.3.18/README.md)
- R3F v9 migration and async `gl` for WebGPU. [r3f docs](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)
- WebGPU migration guide 2026. [Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- `MeshTransmissionMaterial` vs three ≥ 0.180. [three.js forum](https://discourse.threejs.org/t/drei-meshtransmissionmaterial-webgpu/87427)
- CC0 assets: [Poly Haven models](https://polyhaven.com/models/furniture) and [textures](https://polyhaven.com/textures/wood)
