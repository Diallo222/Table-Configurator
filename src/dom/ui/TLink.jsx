import { go } from "../../core/transitions";
import { sound } from "../../core/audio";

/** Link that runs a route transition. Modified clicks fall back to the browser. */
export function TLink({ to, type = "wipe", state, onClick, children, ...rest }) {
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        sound("click");
        go(to, { type, state });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
