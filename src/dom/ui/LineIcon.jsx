// Small line drawings for variant options (24×18 viewBox). Stroke draws in on hover via CSS.
const ICONS = {
  splay: "M2 5h20M6 5l-2 12M18 5l2 12",
  trestle: "M2 5h20M6 5v11M18 5v11M3 16h6M15 16h6M6 11h12",
  arc: "M2 5h20M5 17V9a3 3 0 0 1 3-3M19 17V9a3 3 0 0 0-3-3",
  tube: "M5 17V7h11l3 10M5 11h11",
  sled: "M4 10h11l3 7H3l2-7M15 10l1-4",
  round: "M3 7a9 3 0 1 0 18 0a9 3 0 1 0-18 0M8 9l-2 8M16 9l2 8",
  square: "M4 5h16v3H4zM8 8l-2 9M16 8l2 9",
  cone: "M12 3v4M7 13l5-6 5 6zM12 15v2",
  dome: "M12 3v4M6 13a6 6 0 0 1 12 0zM12 15v2",
  open: "M3 3h18v14H3zM3 10h18M12 3v14",
  backed: "M3 3h18v14H3zM3 10h18M12 3v14M5 5l5 3M14 5l5 3M5 12l5 3M14 12l5 3",
  pillar: "M3 5h18M9 5v12h6V5",
  tripod: "M3 5h18M10 5l-4 12M14 5l4 12M12 5v12",
  cross: "M3 5h18M7 5v12M17 5v12M7 11h10",
  coffee: "M3 10h18M7 10v7M17 10v7",
  side: "M5 5h14M8 5v12M16 5v12",
};

export function LineIcon({ id }) {
  const d = ICONS[id];
  if (!d) return null;
  return (
    <svg className="line-icon" viewBox="0 0 24 18" width="30" height="22" aria-hidden="true">
      <path d={d} pathLength="1" />
    </svg>
  );
}
