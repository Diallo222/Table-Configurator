// Shared pointer state (CSS px + normalised device coords), updated once per event.
export const pointer = {
  x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
  y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  nx: 0,
  ny: 0,
  down: false,
  type: "mouse",
  moved: false,
};

if (typeof window !== "undefined") {
  const move = (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1);
    pointer.type = e.pointerType;
    pointer.moved = true;
  };
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerdown", (e) => {
    move(e);
    pointer.down = true;
  });
  window.addEventListener("pointerup", () => (pointer.down = false));
  window.addEventListener("pointercancel", () => (pointer.down = false));
}

export const isTouch = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
