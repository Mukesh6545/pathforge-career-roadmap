export default function RadarChart({ skills, size = 280 }) {
  if (!skills || skills.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 40;
  const levels = 5;
  const angleStep = (2 * Math.PI) / skills.length;

  function polarToXY(angle, r) {
    return {
      x: cx + r * Math.cos(angle - Math.PI / 2),
      y: cy + r * Math.sin(angle - Math.PI / 2),
    };
  }

  const gridLines = [];
  for (let l = 1; l <= levels; l++) {
    const r = (l / levels) * maxR;
    const points = skills.map((_, i) => {
      const p = polarToXY(i * angleStep, r);
      return `${p.x},${p.y}`;
    }).join(" ");
    gridLines.push(
      <polygon key={l} points={points} fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.6" />
    );
  }

  const axes = skills.map((_, i) => {
    const p = polarToXY(i * angleStep, maxR);
    return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth="1" opacity="0.4" />;
  });

  const requiredPoints = skills.map((s, i) => {
    const r = (s.required / 10) * maxR;
    const p = polarToXY(i * angleStep, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  const currentPoints = skills.map((s, i) => {
    const r = (s.current / 10) * maxR;
    const p = polarToXY(i * angleStep, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  const labels = skills.map((s, i) => {
    const p = polarToXY(i * angleStep, maxR + 22);
    return (
      <text
        key={i}
        x={p.x}
        y={p.y}
        textAnchor="middle"
        dominantBaseline="central"
        className="radar-label"
      >
        {s.name.length > 14 ? s.name.slice(0, 12) + ".." : s.name}
      </text>
    );
  });

  return (
    <div className="radar-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridLines}
        {axes}
        <polygon
          points={requiredPoints}
          fill="rgba(207,154,55,0.15)"
          stroke="var(--gold-500)"
          strokeWidth="2"
          className="radar-area-required"
        />
        <polygon
          points={currentPoints}
          fill="rgba(42,82,163,0.2)"
          stroke="var(--navy-600)"
          strokeWidth="2"
          className="radar-area-current"
        />
        {labels}
      </svg>
      <div className="radar-legend">
        <span className="radar-legend-item"><span className="radar-dot" style={{ background: "var(--navy-600)" }} /> Your Level</span>
        <span className="radar-legend-item"><span className="radar-dot" style={{ background: "var(--gold-500)" }} /> Required</span>
      </div>
    </div>
  );
}
