# ÉTABLI — Implementation Plan

> Companion to [`CONCEPT.md`](./CONCEPT.md). This is the tracking document: tick boxes as work lands.
> Created: 2026-10-19 · Branch: `redesign/etabli` (to be created from `main`)

**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped · **S/M/L/XL** = relative effort

---

## 0. Status board

| Phase | Name | Size | Status | Depends on |
|---|---|---|---|---|
| P0 | Prep & technical spikes | M | ◐ partial (S-01 clock in use; S-06 superseded by D-11) | — |
| P1 | Foundation (tokens, chrome, master clock, router, persistent canvas) | L | ✅ done | P0 |
| P2 | Content & asset pipeline (catalog, models, materials) | L | ✅ done (procedural, D-11) | P0 |
| P3 | Core WebGL systems (stage, sweep, blueprint, lens, post) | XL | ◐ sweep, lens, plan, explode, annotations done · no post stack / dust yet | P1, P2 (ATLAS only) |
| P4 | Loader & intro | M | ✅ done | P3 |
| P5 | Home scroll story (7 chapters) | XL | ✅ v1 done (D-12) | P3 |
| P6 | The Index (`/objects`) | L | ✅ v1 done (D-13) | P3 |
| P7 | The Workbench (configurator) | XL | ✅ v1 done (no Room mode, no ORBIT head IK drag) | P3 |
| P8 | Commission / cart, spec sheet, share | L | ✅ v1 done (crate-fold anim simplified to snapshot flight) | P7 |
| P9 | Route transitions choreography | L | ◐ wipe, object flight, reverse flight, night wipe · no rail / ticketUp | P5, P6, P7 |
| P10 | Sound & micro-interactions polish | M | ◐ sound kit + core micro-interactions | P5–P9 |
| P11 | Responsive, accessibility, reduced motion, fallbacks | L | ◐ breakpoints, aria-live, reduced motion · no no-WebGL fallback | all UI phases |
| P12 | Performance, QA, launch | M | ☐ todo | all |

**Build order:** a vertical slice first. ATLAS goes through every system (P3 → P7) before the other five objects are added. This proves the pipeline before scaling it.

---

## 1. Decisions (log)

| ID | Decision | Rationale | Status |
|---|---|---|---|
| D-01 | Keep **Vite + React 19 + JavaScript** (no Next.js, no TS migration) | Canvas-heavy SPA, persistent canvas, matches current codebase | ✅ accepted (revisit TS if wanted) |
| D-02 | **WebGL2** renderer, GLSL via `three-custom-shader-material`, not WebGPU/TSL | pmndrs postprocessing + drei materials are WebGL-only. R3F v10 is alpha. | ✅ |
| D-03 | **One master clock**: `gsap.ticker` → `lenis.raf` → R3F `advance()` with `frameloop="never"` | Same-frame DOM/WebGL sync (see Haoqi case study) | ⚠ validate in spike S-01 |
| D-04 | **One persistent `<Canvas>`** behind all routes. Scenes swap inside it. | Object flights across routes, no context loss | ✅ |
| D-05 | Sweep = **dual-mesh clip** (material mesh discards above plane + line twin clipped below) | Robust, cheap, works with shadows | ⚠ validate in S-02 |
| D-06 | Lens/Plan = **screen-space composite** from a normal+depth FBO (Sobel lines + hatching + grid) | One pass works for any model, no per-model line authoring | ⚠ validate in S-03 |
| D-07 | Avoid drei `MeshTransmissionMaterial` unless verified on three r186 | Known breakage on ≥ 0.180 | ⚠ check in S-05 |
| D-08 | Checkout = **request form only**, no payment fields | Portfolio piece, no real transactions | ✅ |
| D-09 | Fonts self-hosted via Fontsource (Instrument Serif, Geist, Geist Mono) | Performance, no FOUT from Google CSS @import | ✅ |
| D-10 | Leva kept as **dev-only** tuning panel (`import.meta.env.DEV`) | Fast shader and motion tuning | ✅ |
| D-11 | All six objects are **procedural parametric geometry** (`webgl/objects/builders.js`), no glTF | Real dimension changes without 9-slice hacks, tiny payload, one consistent line style | ✅ |
| D-12 | Home = **pure scroll → scene-state function** per chapter, blended at chapter edges (`dom/pages/home/director.js`), CSS `--p` drives type reveals | Fully reversible, no competing scrubbed timelines writing the same camera | ✅ |
| D-13 | Index cards map **DOM rects → world plane** on the single canvas instead of drei `<View>` | Objects really fly out of their card into the Workbench; Flip layout changes come for free | ✅ |
| D-14 | **Art direction replaced** (CONCEPT §3): cool primer grey + graphite + tape yellow, Archivo only (condensed display, tabular data) | First pass matched the generic AI "warm editorial" look (cream, serif italics, orange accent, mono eyebrows) | ✅ |

**Open questions for the owner**
- [ ] Q-1 Brand name: keep "ÉTABLI" or rename?
- [ ] Q-2 Currency and locale for prices (EUR `3 480 €` vs USD `$3,480`)?
- [ ] Q-3 Model the 5 new objects yourself in Blender, or start from Poly Haven CC0 and adapt?
- [ ] Q-4 Include the optional `/atelier` page and the AR "Room" mode in v1, or defer?

---

## 2. Target stack & versions (verified on npm 2026-10-19)

```jsonc
// dependencies
"three": "^0.186.1",
"@react-three/fiber": "^9.8.2",
"@react-three/drei": "^10.7.9",
"@react-three/postprocessing": "^3.2.0",
"postprocessing": "^6.37.x",
"three-custom-shader-material": "^6.4.0",
"gsap": "^3.15.0",            // all plugins free: ScrollTrigger, SplitText, Flip, DrawSVG, CustomEase, ScrambleText, Draggable, InertiaPlugin, Observer
"@gsap/react": "^2.1.2",
"lenis": "^1.3.27",
"zustand": "^5.0.15",
"react": "^19.3.1", "react-dom": "^19.3.1",
"react-router-dom": "^7.x",
"maath": "^0.10.8",            // damping, easing, random-in-sphere
"@fontsource/instrument-serif", "@fontsource-variable/geist", "@fontsource-variable/geist-mono"

// devDependencies
"leva": "^0.10.1", "r3f-perf": "latest",
"@gltf-transform/cli": "latest", "gltfjsx": "latest"

// remove
"motion" (replaced by GSAP), "react-icons" (custom line icons), "@types/three" (JS project)
```

---

## 3. Target folder structure

```
src/
  main.jsx
  app/
    App.jsx                 # providers + <Experience/> + <RouterOutlet/> + chrome
    routes.jsx
  core/
    clock.js                # master loop (gsap.ticker → lenis → R3F advance)
    scroll.js               # Lenis instance + ScrollTrigger bridge + scroll snapshot
    transitions/
      TransitionManager.jsx # holds navigation until out-anim completes
      transitions.js        # named timelines: lineWipe, objectFlight, rail, ticketUp, nightWipe
    audio/SoundEngine.js    # Web Audio graph, generated sounds
    gpu.js                  # tier detection (drei useDetectGPU) → quality preset
    pointer.js              # shared pointer state (px, ndc, velocity)
  store/
    useConfig.js            # per-object configuration, URL sync
    useCart.js              # commission ticket (persist → localStorage)
    useUI.js                # route, mode (studio/plan/room), theme (day/night), lens, cursor state
    useSound.js
  data/
    catalog.js              # 6 objects: params, variants, materials, pricing, camera presets
    materials.js            # material library (maps, roughness, metadata cards)
    pricing.js
  webgl/
    Experience.jsx          # persistent Canvas (frameloop="never")
    SceneDirector.jsx       # which scene(s) render, selective rendering
    stage/  Stage.jsx Plinth.jsx Cyclorama.jsx Lighting.jsx Shadows.jsx
    camera/ CameraRig.jsx rails.js
    materials/
      chunks/ noise.glsl sweep.glsl stretch.glsl inkbleed.glsl
      SweepMaterial.jsx     # CSM over MeshPhysicalMaterial
      LineTwin.jsx          # edge-line twin used by sweep
      NormalDepthMaterial.js
    effects/
      PostStack.jsx
      BlueprintEffect.js    # Sobel lines + hatching + grid + lens/plan mask
      GrainEffect.js
    systems/
      Sweep.jsx Dust.jsx Annotations.jsx DimensionHandles.jsx
      Exploded.jsx InkBleed.js Snapshot.js
    objects/
      registry.js Atlas.jsx Mira.jsx Orbit.jsx Tripod.jsx Grid.jsx Slab.jsx
    scenes/
      HomeScene.jsx IndexScene.jsx WorkbenchScene.jsx
  dom/
    chrome/  Header.jsx Rulers.jsx Cursor.jsx Coords.jsx SectionMeter.jsx CropMarks.jsx GrainOverlay.jsx
    ui/      Button.jsx SplitReveal.jsx Odometer.jsx Scramble.jsx Segmented.jsx Stepper.jsx
             SwatchTray.jsx LineIcon.jsx AnnotationLabel.jsx BottomSheet.jsx
    loader/  Loader.jsx DrawingSVG.jsx
    pages/   Home/ Index/ Workbench/ Commission/ NotFound/
  styles/  tokens.css base.css fonts.css
  utils/   math.js url.js kelvin.js format.js raycastAxis.js
public/
  models/   atlas.glb mira.glb orbit.glb tripod.glb slab.glb
  textures/ *.ktx2 (or .webp fallback)
  basis/    KTX2 transcoder
  fallback/ per-object stills + turntable sprites (.webp)
  og/       social share images
```

---

## P0. Prep & technical spikes · M

Goal: kill the biggest technical risks *before* building UI. Each spike is a throwaway route `/lab/<name>` (dev only).

- [~] **P0.1** ~~Create branch `redesign/etabli`~~ (done 2026-10-19). Tag current state `v1-legacy`.
- [ ] **P0.2** Upgrade deps to §2 versions. Remove `motion`, `react-icons`. Add GSAP, Lenis, CSM, fonts.
- [ ] **P0.3** Scaffold the folder structure (§3). Move legacy files to `src/_legacy/` (delete in P12).
- [ ] **S-01 Master clock spike**: `Canvas frameloop="never"`, `gsap.ticker` drives `lenis.raf(t*1000)` then `advance(t*1000)`. A DOM box and a WebGL box are both bound to scroll. **Pass:** no visible offset at fast trackpad flicks. Check R3F pointer events still fire.
- [ ] **S-02 Sweep spike**: ATLAS with CSM `discard` above `uSweep` + emissive band, line twin with `clippingPlanes` below. Shadows use a matching `customDepthMaterial`. **Pass:** clean seam, no shadow leaks, 60 fps.
- [ ] **S-03 Blueprint composite spike**: render scene with `NormalDepthMaterial` (override) into a `useFBO`, then a custom `postprocessing` Effect does Sobel + hatch + grid inside a cursor circle. **Pass:** crisp 1-px lines at DPR 2, lens follows cursor with no lag.
- [ ] **S-04 9-slice stretch spike**: vertex stretch of ATLAS top (bevel preserved) + box-projected UVs so wood grain doesn't smear. **Pass:** 700 → 2 400 mm with no bevel distortion.
- [ ] **S-05 Compatibility check**: drei `Edges`, `View`, `ContactShadows`, `Environment`, `useFBO`, `MeshTransmissionMaterial` on three r186. Note any breakage.
- [ ] **S-06 Asset pipeline dry run**: re-export `Table.gltf` (8.3 MB, uncompressed) → `atlas.glb` with Meshopt + KTX2. **Target:** < 1 MB.

**DoD:** all spikes pass or have a documented fallback in §1 Decisions.

---

## P1. Foundation · L

### P1.A Design system
- [ ] **P1.1** `styles/tokens.css`: palette (day/night, see CONCEPT §3.2), type scale, spacing (8 px base), radii (mostly 0 / 2 px), z-index layers, motion tokens as CSS vars.
- [ ] **P1.2** Theme switching via `data-theme="night"` on `<html>`. Tokens tween with GSAP (CSS vars) for the radial night wipe.
- [ ] **P1.3** `fonts.css`: Fontsource imports, `font-display: swap`, preload the display face.
- [ ] **P1.4** Tailwind v4 `@theme` mapped onto the tokens (keep Tailwind for layout utilities).
- [ ] **P1.5** Base primitives: `Button` (draw-then-fill hover), `LineIcon` (SVG stroke icons, draw on hover), `Segmented`, `Stepper`, `Odometer` (rolling digits), `Scramble` (ScrambleText), `SplitReveal` (SplitText masked lines/chars, blur variant).

### P1.B Chrome
- [ ] **P1.6** `Rulers`: top/left SVG rulers, ticks every 10 units (major every 100), cursor markers, scroll offset, `setScale(mmPerPx)` API for the Workbench.
- [ ] **P1.7** `Cursor`: crosshair + readout. State machine `default | lens | handle | drag | link | rotate`, driven by `useUI.cursor`. Lerped follow via `gsap.quickTo`.
- [ ] **P1.8** `Header` (logo, nav, commission counter, night toggle, sound toggle), `Coords` (live X/Y), `SectionMeter` (§ + %), `CropMarks`, `GrainOverlay` (CSS noise, animated via steps).
- [ ] **P1.9** Magnetic hover utility (`useMagnetic(ref, strength)`).

### P1.C Engine
- [ ] **P1.10** `core/clock.js` + `core/scroll.js` from S-01 (see Appendix A). Expose `getScroll()` snapshot read by `useFrame` consumers.
- [ ] **P1.11** `webgl/Experience.jsx`: fixed full-viewport `<Canvas>` (`frameloop="never"`, `dpr` from GPU tier, `gl={{ antialias:false, powerPreference:'high-performance' }}`, AgX tone mapping, sRGB). `eventSource` = root element so DOM on top doesn't block pointer events.
- [ ] **P1.12** `SceneDirector`: maps `useUI.route` → active scene(s). Supports **selective rendering**: scenes outside scroll range skip render (Shader.se pattern).
- [ ] **P1.13** Router (`routes.jsx`) + `TransitionManager`: intercept navigations, run `out` timeline → swap route → run `in` timeline. Interruptible (click mid-transition = `timeline.progress(1)`).
- [ ] **P1.14** Stores: `useUI`, `useConfig` (with URL sync, Appendix G), `useCart` (`persist`), `useSound`.
- [ ] **P1.15** `core/gpu.js`: quality presets `high | medium | low` (DPR cap, SSAO/bloom on/off, particle counts, shadow res).
- [ ] **P1.16** Dev tools: Leva panels + `r3f-perf` behind `?debug`.

**DoD:** empty pages route with the line-wipe placeholder, chrome works, a test cube in the canvas stays scroll-locked to a DOM box, and night toggle flips tokens.

---

## P2. Content & asset pipeline · L

### P2.A Catalog
- [ ] **P2.1** `data/catalog.js` schema (Appendix H): `slug, n°, name, type, story, params (dims with min/max/step/default), variants, parts → materialSlots, pricing, camera presets (studio/plan views), annotations (part anchors + labels), exploded vectors`.
- [ ] **P2.2** `data/materials.js`: ~14 materials. Woods: oak, walnut, ash, cherry, black-stained oak. Stones: travertine, Carrara, terrazzo. Metals: powder-coat graphite, bone, vermilion, brushed steel. Fabrics: bouclé, linen, wool. Each has maps, roughness, `card` metadata (origin, hardness, finish).
- [ ] **P2.3** `data/pricing.js`: `base + Σ(dim × rate) + material multipliers + variant deltas`, all pure functions with unit tests.
- [ ] **P2.4** Copywriting pass: object stories (≤ 30 words each), annotations, manifesto lines, microcopy, 404.

### P2.B Models
Per model checklist: real-world scale (1 unit = 1 m), origin at floor centre, Y-up, parts as separate named nodes matching `catalog.parts`, clean UVs (box-projectable for wood), ≤ 40 k tris, `extras.explode = [x,y,z]` custom property on parts.

- [ ] **P2.5** 01 ATLAS: re-export from Blender with separated parts (top, 3 base variants, stretchers, bolts for exploded view), stretch-friendly topology (edge loops at bevel boundaries).
- [ ] **P2.6** 02 MIRA: lounge chair (`mid_century_lounge_chair` base): frame / seat / back as separate slots.
- [ ] **P2.7** 03 ORBIT: desk lamp (`desk_lamp_arm_01`, rigged): verify bones, name `upper`, `fore`, `head`, add bulb emissive part.
- [ ] **P2.8** 04 TRIPOD: stool (`wooden_stool_02`): legs as separate nodes (recomputed splay per height).
- [ ] **P2.9** 05 GRID: procedural module set in code (panel, post, back, shelf) with shared rounded-box geometry. No glTF.
- [ ] **P2.10** 06 SLAB: side/coffee table (`modern_coffee_table_01`): stone top + base slots.
- [ ] **P2.11** Pipeline script `scripts/optimize-models.sh`:
  ```bash
  npx @gltf-transform/cli optimize raw/atlas.glb public/models/atlas.glb \
    --compress meshopt --texture-compress ktx2   # needs KTX-Software `toktx`; fallback: --texture-compress webp
  npx gltfjsx public/models/atlas.glb -o src/webgl/objects/_gen/AtlasModel.jsx --shadows
  ```
- [ ] **P2.12** Materials textures: Poly Haven 1k (albedo/normal/rough) → KTX2 (UASTC normals, ETC1S albedo). Budget **≤ 400 KB per material**.
- [ ] **P2.13** Fallback stills + 36-frame turntable sprite per object (rendered in Blender) → `public/fallback/`.

**DoD:** 6 objects load in a `/lab/catalog` page, all under budget (Appendix J).

---

## P3. Core WebGL systems · XL

### P3.A Stage
- [ ] **P3.1** `Cyclorama`: seamless curved backdrop (floor-to-wall sweep) with a shader whose colour = `--paper` token (uniform tweened with theme) + vignette + faint drafting grid on the floor (world-space, fades with distance).
- [ ] **P3.2** `Plinth`: monolithic block, slightly rounded, travertine/paper material. API: `rise()`, `sink()`, `swap(object)`.
- [ ] **P3.3** `Lighting`: drei `<Environment frames={1} resolution={256}>` with art-directed `Lightformer`s (key softbox, rim strip, warm bounce). Day and night presets, tweenable.
- [ ] **P3.4** `Shadows`: `ContactShadows` re-rendered **only on config change** (`frames={1}` + key bump) + a soft directional shadow for the object.
- [ ] **P3.5** `CameraRig`: damped camera (maath `easing.damp3`) with named presets per scene/object, inertial drag-rotate with polar/azimuth limits, `flyTo(preset, {duration, ease})` returning a promise, near-orthographic mode for Plan (fov → 6°, distance compensated).

### P3.B Sweep (signature 4.1)
- [ ] **P3.6** `SweepMaterial` (CSM over `MeshPhysicalMaterial`): `uSweep`, `uDir`, noise-perturbed plane, emissive vermilion band, discard beyond the plane (Appendix B). Matching depth material for shadows.
- [ ] **P3.7** `LineTwin`: drei `<Edges threshold={20}>` + faint paper-coloured fill, clipped on the opposite side via `material.clippingPlanes` (enable `gl.localClippingEnabled`).
- [ ] **P3.8** `Sweep` system API: `sweep.in(object, {duration, from:'bottom'|'top'|'left'})`, `sweep.out(…)`, `sweep.scrub(object, progress)` (for ScrollTrigger). Returns GSAP timelines.
- [ ] **P3.9** `Dust`: per object `MeshSurfaceSampler` → 3–6 k points. Points shader shows only samples near the plane, lifts them with curl noise and fades over ~1.2 s. Instanced, one draw call.
- [ ] **P3.10** Variant switch = `sweep.out(old)` ‖ `sweep.in(new)` overlapping 40 %.

### P3.C Blueprint, Lens, Plan (signatures 4.2)
- [ ] **P3.11** `NormalDepthMaterial`: outputs `normal.xy`, linear depth, `N·L` (for hatching) into an RGBA half-float FBO. Rendered as `scene.overrideMaterial` pass **only when mask > 0**.
- [ ] **P3.12** `BlueprintEffect` (postprocessing `Effect`): Sobel on normal + depth → ink lines, cross-hatching from `N·L` (screen-space line patterns at 2 angles), paper tint, 8 mm grid, and a mask = lens circle ∪ plan mode (Appendix E).
- [ ] **P3.13** Lens interaction: radius spring (0 → 120 px on object hover, → full screen on press-and-hold > 350 ms = Plan mode), noise-wobbled edge, vermilion rim, follows pointer with `quickTo` lag.
- [ ] **P3.14** Hidden-line hint (stretch goal): dashed lines for occluded edges via a second depth compare.

### P3.D Post & polish
- [ ] **P3.15** `PostStack`: `BlueprintEffect` → Bloom (mipmap, threshold high, night only) → SMAA → Grain (animated, subtle) → Vignette (very light). Optional N8AO on `high` tier.
- [ ] **P3.16** `Annotations`: anchor points per part (from catalog) → projected to screen each frame → `AnnotationLabel` DOM + SVG leader lines. Occlusion test (raycast or depth sample) fades hidden labels.
- [ ] **P3.17** `Exploded`: `explode(amount 0..1)` moves parts along `extras.explode` vectors with stagger. Scroll-scrubbable.

**DoD:** `/lab/atlas` shows ATLAS on the plinth with sweep in/out, lens, hold-for-plan, exploded view, annotations, at 60 fps on desktop.

---

## P4. Loader & intro · M

- [ ] **P4.1** `DrawingSVG`: ÉTABLI wordmark + ATLAS orthographic front silhouette as SVG paths, exported from the same camera projection used in WebGL.
- [ ] **P4.2** Loading driven by `useProgress`. DrawSVG length = progress. Mono counter `0000 → 1840 mm`, scrambling digits.
- [ ] **P4.3** Handoff: when loaded, align the 3D blueprint view (Plan mode, front, ortho) exactly under the SVG, crossfade (≤ 150 ms, imperceptible), then rotate the camera to 3/4 and run `sweep.in(atlas)`.
- [ ] **P4.4** Headline intro: SplitText chars, blur → sharp, random order (Trionn `BlurTextReveal` pattern). Chrome draws in (rulers tick out from the corner).
- [ ] **P4.5** Returning visitors (sessionStorage flag): shortened 1.2 s intro.

**DoD:** first paint < 1 s (SVG only), seamless 2D → 3D handoff, total intro ≤ 4.5 s, skippable by click or scroll.

---

## P5. Home scroll story · XL

Each chapter = a DOM section + a canvas "beat" bound to ScrollTrigger progress. Camera and object states are keyframed per chapter in `HomeScene` (one master timeline scrubbed by scroll, with labels per chapter).

- [ ] **P5.1** §01 **Hero**: headline layered front/behind the table (two DOM layers, z-split), lens active, mouse-follow tilt with inertia, scroll hint (line drawing down).
- [ ] **P5.2** §02 **The Line**: pinned ~200 vh. `exploded(0→1)`, camera orbit to axonometric, annotations draw in sequence, manifesto SplitText lines masked reveal.
- [ ] **P5.3** §03 **Collection 01**: pinned horizontal, 6 plinths on a rail. Each object `sweep.scrub()` as it nears centre. Giant name vertical-roll swap. Click/Enter → Workbench (object flight, P9). Preload each object as it approaches.
- [ ] **P5.4** §04 **Measure**: Plan view top-down ATLAS, width scrubbed 700 → 2 400 mm, rulers re-scale, odometer, chair icons draw in (2 → 10 seats).
- [ ] **P5.5** §05 **Material Library**: interactive (not pinned): TRIPOD + swatch tray, drag-and-drop ink-bleed (reuses P7 system), spec cards scramble in.
- [ ] **P5.6** §06 **The Atelier**: 4 steps horizontal or stacked. Joinery mini-animation (two parts slide and lock with a knock). ORBIT descends, clicks on → **night wipe** from bulb screen position.
- [ ] **P5.7** §07 **Footer**: outline wordmark (SVG), letters fill on hover with stagger, CTA, credits, "back to top" (fast reverse scrub of master timeline, ~1.5 s).
- [ ] **P5.8** `gsap.matchMedia()` variants for desktop / tablet / mobile / reduced-motion.

**DoD:** full scroll top → bottom → top with no jank, every beat reversible, Lighthouse perf ≥ 80 on desktop.

---

## P6. The Index (`/objects`) · L

- [ ] **P6.1** Studio grid: 3×2 `drei <View>` cards (single canvas, scissor), each with mini plinth + idle rotation + hover turn-to-cursor + lazy load on intersection.
- [ ] **P6.2** Plan archive list: top-down blueprint drawings per object (rendered via `Snapshot` in Plan mode at build time or first visit and cached as images), with mono specs columns.
- [ ] **P6.3** View toggle Studio ⇄ Plan with **GSAP Flip** (cards ↔ rows).
- [ ] **P6.4** Category filters with Flip reflow + count odometer.
- [ ] **P6.5** Hover row in Plan view: drawing → colour sweep (CSS mask using the same noise edge look).
- [ ] **P6.6** Card → Workbench object flight hook (implemented in P9).

**DoD:** both views, filters, keyboard navigation, all cards ≥ 50 fps.

---

## P7. The Workbench (configurator) · XL

### P7.A Layout & shell
- [ ] **P7.1** Page shell: title block (N°, name, type, story), price odometer + Δ ghost, spec panel (right) / bottom sheet (mobile), mode segmented `Studio | Plan | Room`, prev/next rail, CTA.
- [ ] **P7.2** Config state per object from `catalog` defaults, overridden by URL params. Every change → URL (`replaceState`, debounced) + `aria-live` message.

### P7.B Signature controls
- [ ] **P7.3** **Drag-to-measure** (`DimensionHandles`): 3D dimension lines + arrow handles per `params.dims`. Pointer → closest point on axis (Appendix F), clamp + snap 10 mm, cursor `⟷ value`, ruler re-scale, tick sound + vibrate. Keyboard: focus handle, arrows ±10, Shift ±100.
- [ ] **P7.4** **9-slice stretch** (`stretch.glsl`, Appendix C) wired to dims for ATLAS and SLAB. Base/legs reposition from catalog rules.
- [ ] **P7.5** **Variants**: line-icon selectors (animated SVG). Switching runs mini sweep out/in.
- [ ] **P7.6** **Ink-bleed materials** (`inkbleed.glsl`, Appendix D): `SwatchTray` with GSAP Draggable chips. On drop, raycast canvas → part + hit point → bleed from hit point (0.9 s). Click = bleed from part centre. Chip "absorbs" (scale-to-point) on drop.
- [ ] **P7.7** **Finish** (matte/satin/gloss): roughness + clearcoat tween + a moving light-sweep highlight (Lightformer animated across).
- [ ] **P7.8** **Modes**: Plan = lens full-screen + ortho camera + full dimensioning + inline-editable values. Front/side/top arrows. Room (stretch) = vignette environment swap.

### P7.C Object-specific features
- [ ] **P7.9** ATLAS: width 700–2 400, depth 750–1 100, base Trestle / Splay / Arc, top material, base tint.
- [ ] **P7.10** MIRA: frame wood, seat + back fabric (separate drop targets), cushion variant.
- [ ] **P7.11** ORBIT: grab head → 2-bone IK (three `CCDIKSolver` or analytic 2-bone), joint limits, Kelvin 2700–4000 (Appendix I) drives light colour + bulb emissive. Turning on = local night mode.
- [ ] **P7.12** TRIPOD: height 450–800 with leg splay recompute (angle from height), seat round/square.
- [ ] **P7.13** GRID: columns 1–6, rows 1–5 via edge handles. Modules pop in (draw lines → fill, stagger), with optional doors/drawers per cell (click cell to cycle).
- [ ] **P7.14** SLAB: top stone (travertine/Carrara/terrazzo), polished vs honed (clearcoat), diameter or width.

### P7.D Navigation
- [ ] **P7.15** Prev/next object: dematerialise → camera rail dolly → materialise. URL updates. Preload neighbours on page enter.

**DoD:** every control works with mouse, touch and keyboard. Config round-trips via URL. ATLAS first, then the other 5.

---

## P8. Commission, spec sheet, share · L

- [ ] **P8.1** `Snapshot.js`: offscreen render of current config (studio 3/4 + plan front/side/top) into a render target, read to `ImageBitmap`/dataURL. Used for cart thumbnails and spec sheet.
- [ ] **P8.2** **Add to commission** animation: line-drawn crate folds around the object (SVG or 3D line box), stamp `N° 00xx`, Flip flight to header counter, counter roll.
- [ ] **P8.3** `/commission` Ticket page: perforated edge, line items (snapshot, spec summary, price, qty, edit → back to Workbench with that config, remove with tear animation), totals odometer.
- [ ] **P8.4** Request form (name, email, notes). **No payment fields.** Client-side only (or a mail service later). "RECEIVED" stamp slam + ticket tear-off.
- [ ] **P8.5** **Spec sheet**: A4 composition on a 2D canvas (title block, 4 views, config table, ref no., date, "Drawn by: you") → PNG download. PDF via `canvas → jsPDF` optional.
- [ ] **P8.6** **Share**: copy URL with config, `navigator.share` on mobile, toast drawn as a line callout.

**DoD:** add → edit → remove → request flow works and persists across reloads. Spec sheet renders correctly for all 6 objects.

---

## P9. Route transitions · L

- [ ] **P9.1** `lineWipe` (default): SVG vermilion line draws across, paper panel follows, swap, exits.
- [ ] **P9.2** `objectFlight` (Collection/Index → Workbench and back): FLIP between the card's screen rect and the stage pose, computed by unprojecting the card rect into world space, then camera + object tween, plinth rise, UI draw-in.
- [ ] **P9.3** `rail` (Workbench → Workbench).
- [ ] **P9.4** `ticketUp` (→ Commission) with paper curl (CSS 3D or shader on a plane).
- [ ] **P9.5** `nightWipe` (radial clip-path from a screen point + token tween + scene light preset tween).
- [ ] **P9.6** Interrupt and fast-forward handling, browser back/forward support, scroll restoration per route.

**DoD:** every route pair has a defined transition ≤ 1.6 s with no flashes of empty canvas or unstyled DOM.

---

## P10. Sound & micro-interactions · M

- [ ] **P10.1** `SoundEngine`: lazy `AudioContext` on first gesture, master gain, mute persisted. Generated voices: pencil scratch (bandpassed noise, gain ← line speed), wood tick (short sine + noise burst, pitch ← value), pat/bleed swell, knock, lamp click + hum, stamp thump.
- [ ] **P10.2** Bind sounds to the same values as visuals (sweep progress velocity, drag velocity, ripple energy).
- [ ] **P10.3** Micro-interactions audit: every hover, focus, press state designed (buttons, links, swatches, handles, nav, toggles).
- [ ] **P10.4** Numbers: every changing number uses Odometer or Scramble.
- [ ] **P10.5** Easter eggs: 404 drag-the-leg, Konami → "Drafting mode" (everything permanently blueprint), footer wordmark easter egg.

---

## P11. Responsive, accessibility, fallbacks · L

- [ ] **P11.1** Breakpoints per CONCEPT §9. Bottom sheet with snap points for the Workbench on mobile.
- [ ] **P11.2** Touch: long-press lens, 44 px handle hit areas, swatch drag via touch (Draggable), no hover-only features.
- [ ] **P11.3** `prefers-reduced-motion`: disable Lenis smoothing, replace flights/sweeps with short fades, no dust/grain animation (one `gsap.matchMedia` gate + `useUI.reducedMotion` flag for WebGL).
- [ ] **P11.4** Keyboard: logical focus order, visible focus ring (vermilion 2 px offset), skip link, all 3D controls mirrored in the DOM panel.
- [ ] **P11.5** Screen readers: semantic landmarks, `aria-live` config announcements, alt text for snapshots, canvas `aria-hidden` with a textual description.
- [ ] **P11.6** No-WebGL / `low` tier fallback: stills + turntable sprites, DOM-only configurator.
- [ ] **P11.7** Contrast check of tokens (day & night), `forced-colors` sanity.

---

## P12. Performance, QA, launch · M

- [ ] **P12.1** Budgets (Appendix J) enforced: `rollup-plugin-visualizer`, code-split routes, lazy-load non-hero objects, `useGLTF.preload` on hover/approach.
- [ ] **P12.2** GPU: draw calls < 150, `r3f-perf` pass on every scene, dispose on unmount, texture reuse, `PerformanceMonitor` → auto-degrade tier.
- [ ] **P12.3** Pause rendering when tab hidden or canvas offscreen. Selective rendering verified.
- [ ] **P12.4** Cross-browser: Chrome, Safari (macOS + iOS), Firefox, Edge. Android mid-range device test.
- [ ] **P12.5** SEO/meta: titles per route, OG images per object (from Snapshot), `sitemap.xml`, favicon set (line-drawn É).
- [ ] **P12.6** Delete `src/_legacy`, update README (new concept, stack, credits for CC0 assets).
- [ ] **P12.7** Deploy to Vercel (existing project), preview → production.
- [ ] **P12.8** Awards prep: 30 s screen-capture reel, case-study write-up (Codrops-style), submit to Awwwards / FWA / CSSDA.

---

## Appendix A. Master clock (S-01 / P1.10)

```js
// core/scroll.js
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export const lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);

const snapshot = { y: 0, velocity: 0, progress: 0 };
export const getScroll = () => snapshot;

// core/clock.js
import { advance } from "@react-three/fiber";
gsap.ticker.lagSmoothing(0);
gsap.ticker.add((time) => {
  const ms = time * 1000;
  lenis.raf(ms);                       // 1. scroll
  snapshot.y = lenis.scroll;
  snapshot.velocity = lenis.velocity;
  snapshot.progress = lenis.progress;
  // 2. GSAP tweens already ran this tick (ticker order)
  advance(ms);                          // 3. render WebGL with this frame's values
});
// <Canvas frameloop="never"> in Experience.jsx
```

## Appendix B. Sweep fragment (CSM)

```glsl
// vertex
varying vec3 vWorldPos;
void main() { vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz; }

// fragment
uniform float uSweep;   // world-space plane height
uniform float uBand;    // glow band width (m)
uniform vec3  uPencil;  // vermilion
varying vec3 vWorldPos;
#include <noise>        // snoise()
void main() {
  float n = snoise(vWorldPos * 6.0) * 0.025;
  float d = vWorldPos.y - (uSweep + n);
  if (d > 0.0) discard;                       // not yet materialised
  float edge = 1.0 - smoothstep(0.0, uBand, -d);
  csm_Emissive = uPencil * edge * 4.0;        // scan line glow
}
```

## Appendix C. 9-slice stretch (vertex, CSM)

```glsl
uniform vec3 uCore;   // half-extents of the stretchable core (object space, bbox minus bevel)
uniform vec3 uDelta;  // extra half-length per axis
varying vec3 vBoxPos; // stretched position → box-projected UVs (grain doesn't smear)
void main() {
  vec3 p = position;
  vec3 a = abs(p);
  vec3 inside = step(a, uCore);                       // 1 inside core, 0 in bevel zone
  vec3 scaled = p * (1.0 + uDelta / max(uCore, 1e-4)); // core stretches linearly
  vec3 shifted = p + sign(p) * uDelta;                 // bevels translate rigidly
  p = mix(shifted, scaled, inside);
  vBoxPos = p;
  csm_Position = p;
}
```

## Appendix D. Ink-bleed (fragment, CSM)

```glsl
uniform sampler2D uMapA, uMapB;
uniform float uRoughA, uRoughB, uProg, uRadius;
uniform vec3 uHit;               // drop point in object space
varying vec3 vObjPos; varying vec2 vUv2;
void main() {
  float n = fbm(vObjPos * 4.0);
  float dist = distance(vObjPos, uHit) + n * 0.08;
  float front = uProg * uRadius;
  float m = 1.0 - smoothstep(front - 0.02, front, dist);   // 1 = new material
  float wet = smoothstep(front - 0.06, front, dist) * m;   // darker rim at the front
  vec4 col = mix(texture2D(uMapA, vUv2), texture2D(uMapB, vUv2), m);
  csm_DiffuseColor = vec4(col.rgb * (1.0 - wet * 0.35), 1.0);
  csm_Roughness = mix(uRoughA, uRoughB, m) - wet * 0.3;
}
// on complete: A := B, uProg := 0
```

## Appendix E. Blueprint / Lens effect (postprocessing)

```glsl
uniform sampler2D tND;          // rg = normal.xy, b = linear depth, a = N·L
uniform vec2 uMouse; uniform float uRadius, uAspect, uTime, uPlan; uniform vec2 uTexel;
float edge(vec2 uv) { /* Sobel on normal + depth (3×3) → 0..1 */ }
float hatch(vec2 uv, float ndl) { /* 2 line sets at 45°/-45°, density ← 1-ndl */ }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 d = uv - uMouse; d.x *= uAspect;
  float r = uRadius * (1.0 + 0.04 * sin(atan(d.y, d.x) * 5.0 + uTime * 1.5));
  float lens = 1.0 - smoothstep(r - 0.004, r, length(d));
  float mask = max(lens, uPlan);
  if (mask <= 0.0) { outputColor = inputColor; return; }
  vec4 nd = texture2D(tND, uv);
  float ink = max(edge(uv), hatch(uv, nd.a) * 0.35);
  float grid = /* 8 mm grid in screen space */ 0.0;
  vec3 bp = mix(PAPER, INK, max(ink, grid * 0.12));
  vec3 col = mix(inputColor.rgb, bp, mask);
  float rim = (1.0 - uPlan) * lens * smoothstep(r - 0.006, r - 0.003, length(d));
  outputColor = vec4(mix(col, PENCIL, rim), 1.0);
}
```

## Appendix F. Drag along an axis

```js
// closest point on axis (p + s·a) to the pointer ray (o + t·d) → returns s
export function rayAxisParam(o, d, p, a) {
  const w0 = o.clone().sub(p);
  const A = a.dot(a), B = a.dot(d), C = d.dot(d), D = a.dot(w0), E = d.dot(w0);
  const den = A * C - B * B;
  return Math.abs(den) < 1e-6 ? 0 : (B * E - C * D) / den;
}
// mm = clamp(round((s0 + s) * 1000 / step) * step, min, max)
```

## Appendix G. Config ⇄ URL

```js
// /objects/atlas?w=1840&d=900&base=splay&top=walnut&tint=graphite&fin=satin
export const encode = (cfg) => new URLSearchParams(cfg).toString();
export function decode(search, schema) {
  const q = new URLSearchParams(search), out = {};
  for (const [k, s] of Object.entries(schema)) {
    const v = q.get(k);
    if (s.type === "num") out[k] = clamp(Number(v ?? s.default) || s.default, s.min, s.max);
    else out[k] = s.options.includes(v) ? v : s.default;
  }
  return out;
}
```

## Appendix H. Catalog entry (shape)

```js
{
  slug: "atlas", no: "01", name: "ATLAS", type: "Dining table",
  story: "A long table for long dinners.",
  model: "/models/atlas.glb",
  params: {
    w:    { type: "num", min: 700, max: 2400, step: 10, default: 1600, axis: "x", label: "Width" },
    d:    { type: "num", min: 750, max: 1100, step: 10, default: 900,  axis: "z", label: "Depth" },
    base: { type: "enum", options: ["trestle", "splay", "arc"], default: "splay" },
    top:  { type: "material", slot: "top",  options: ["oak", "walnut", "ash", "black-oak"], default: "oak" },
    tint: { type: "material", slot: "base", options: ["graphite", "bone", "vermilion", "steel"], default: "graphite" },
    fin:  { type: "enum", options: ["matte", "satin", "gloss"], default: "satin" },
  },
  pricing: { base: 1900, perMm: { w: 0.9, d: 0.6 }, materials: { walnut: 1.25, "black-oak": 1.15 } },
  annotations: [{ part: "top", anchor: [0.6, 0.76, 0.3], label: "01 TOP — Solid {top} 32 mm" }],
  cameras: { studio: [3.2, 1.8, 3.6], front: [0, 0.4, 6], side: [6, 0.4, 0], top: [0, 6, 0.001] },
}
```

## Appendix I. Kelvin → RGB (ORBIT)

```js
// Tanner Helland approximation, k in Kelvin (1000–40000)
export function kelvinToRgb(k) {
  const t = k / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661
                    : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [r, g, b].map((c) => Math.min(255, Math.max(0, c)) / 255);
}
```

## Appendix J. Budgets

| Metric | Target |
|---|---|
| Initial JS (gzip) | ≤ 450 KB (three + R3F included), route chunks ≤ 80 KB |
| Hero payload (ATLAS + env + fonts) | ≤ 2.5 MB |
| Per object model | ≤ 1 MB (Meshopt) · ≤ 40 k tris |
| Per material | ≤ 400 KB (KTX2) |
| First paint (loader SVG) | < 1 s |
| Interactive hero | < 3 s desktop broadband, < 5 s 4G mobile |
| Frame rate | 60 fps desktop mid GPU · ≥ 45 fps mid mobile |
| Draw calls | < 150 per frame |
| Lighthouse (desktop) | Perf ≥ 80 · A11y ≥ 95 · Best practices ≥ 95 · SEO ≥ 95 |

---

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Single-clock approach breaks drei components relying on R3F's own loop | High | S-01. Fallback: R3F `addEffect` drives `lenis.raf` (Haoqi pattern) and GSAP stays on its own ticker for DOM-only tweens. |
| Blueprint Sobel lines too noisy on fabric/organic meshes | Med | Depth/normal thresholds per object (catalog), plus optional authored `Edges` for clean silhouettes |
| Asset quality and consistency of 5 new models | High | Restyle all models with the same material library and lighting. Model hero pieces in Blender if needed (Q-3). |
| ORBIT IK feels janky | Med | Analytic 2-bone IK with damping and joint limits. Fallback: preset poses with smooth tweening. |
| Mobile GPU performance | High | GPU tiers, `PerformanceMonitor` auto-degrade, selective rendering, DPR caps |
| Scope creep (6 objects × unique features) | High | Vertical slice with ATLAS first. Room/AR and `/atelier` are optional (Q-4). |

---

## Session log

> Append one line per work session: date — phases touched — notes.

- 2026-10-19 — Concept + plan drafted. Research: Codrops (Shader.se, Trionn, Haoqi, datamosh, VAT, Lusion), Utsubo 2026 roundup, Awwwards configurators, npm versions, Poly Haven catalog.
- 2026-10-24 — P5 Home (7 chapters), P6 Index (studio ⇄ plan Flip, filters), P8 Commission ticket + request flow; `ui.css`/`pages.css`; shared scene helpers (`dom/pages/scene.js`); fixes: top-view camera roll, Workbench studio framing, snapshot hides handles, lint config for R3F. Verified in headless Chrome (desktop + ~500 px).
- 2026-10-24 — Art direction pass (D-14): new tokens, Archivo, tape-measure range/curtain/favicon, copy rewritten without slogans, italics, eyebrows or em-dashes; lamp default coat signal yellow.
