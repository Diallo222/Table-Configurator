import { useUI } from "../../store/useUI";

export function Announcer() {
  const text = useUI((s) => s.announce);
  return (
    <div className="sr-only" role="status" aria-live="polite">
      {text}
    </div>
  );
}
