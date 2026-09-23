import { useState } from "react";

const TAB_ICONS = {
  overview: "~",
  companies: "#",
  projects: ">",
  certificates: "*",
  target: "@",
  interview: "?",
  resume: "R",
  schedule: "S",
};

export default function FloatingNav({ tabs, activeTab, onNavigate }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`fab-container ${open ? "open" : ""}`}>
      {open && (
        <div className="fab-menu">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`fab-menu-item ${activeTab === t.id ? "active" : ""}`}
              onClick={() => { onNavigate(t.id); setOpen(false); }}
            >
              <span className="fab-menu-icon">{TAB_ICONS[t.id] || t.label[0]}</span>
              <span className="fab-menu-label">{t.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="fab-button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Quick navigation"
      >
        <span className={`fab-icon ${open ? "open" : ""}`}>
          {open ? "\u00D7" : "\u2630"}
        </span>
      </button>
    </div>
  );
}
