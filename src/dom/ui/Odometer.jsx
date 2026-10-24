const DIGITS = "0123456789";

/** Rolling digits. Non-digit characters (spaces, €, ×) render statically. */
export function Odometer({ value, className = "" }) {
  const chars = String(value).split("");
  return (
    <span className={`odo ${className}`} aria-label={String(value)}>
      {chars.map((ch, i) => {
        const key = chars.length - i; // align from the right so units stay put when length changes
        if (!DIGITS.includes(ch))
          return (
            <span key={`s${key}`} className="odo__static" aria-hidden="true">
              {ch === " " ? " " : ch}
            </span>
          );
        return (
          <span key={`d${key}`} className="odo__col" aria-hidden="true">
            <span className="odo__strip" style={{ transform: `translateY(${-Number(ch) * 10}%)`, transitionDelay: `${(i % 4) * 0.035}s` }}>
              {DIGITS.split("").map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
