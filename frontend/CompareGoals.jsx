import { useState } from "react";

const BASE = "/api";

export default function CompareGoals({ currentGoal, cgpa, branch, goals }) {
  const [compareGoalId, setCompareGoalId] = useState("");
  const [comparePlan, setComparePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleCompare() {
    if (!compareGoalId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cgpa, goal: compareGoalId, branch }),
      });
      const data = await res.json();
      setComparePlan(data);
    } catch {
      setComparePlan(null);
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button type="button" className="secondary compare-trigger" onClick={() => setOpen(true)}>
        Compare with another goal
      </button>
    );
  }

  const otherGoals = goals.filter((g) => g.id !== currentGoal.id);

  return (
    <div className="compare-panel panel">
      <div className="item-title-row" style={{ justifyContent: "space-between", width: "100%" }}>
        <h3 style={{ margin: 0, border: "none", padding: 0 }}>Compare Career Goals</h3>
        <button type="button" className="secondary" onClick={() => { setOpen(false); setComparePlan(null); }}>Close</button>
      </div>

      <div className="compare-select-row">
        <select value={compareGoalId} onChange={(e) => { setCompareGoalId(e.target.value); setComparePlan(null); }}>
          <option value="">Pick a goal to compare...</option>
          {otherGoals.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button type="button" onClick={handleCompare} disabled={!compareGoalId || loading}>
          {loading ? "Loading..." : "Compare"}
        </button>
      </div>

      {comparePlan && comparePlan.goalPlan && (
        <div className="compare-columns">
          <div className="compare-col">
            <h4 className="compare-col-heading current">{currentGoal.name}</h4>
            <div className="compare-section">
              <p className="compare-label">Package Range</p>
              <p className="compare-value">{comparePlan.companyPlan?.packageEstimate?.range || "N/A"}</p>
            </div>
            <div className="compare-section">
              <p className="compare-label">Projects ({currentGoal.projects.length})</p>
              {currentGoal.projects.slice(0, 3).map((p) => (
                <p key={p.id} className="compare-item">
                  <span className={`value-tag ${p.resumeValue === "High" ? "high" : "medium"}`}>{p.resumeValue}</span> {p.title}
                </p>
              ))}
              {currentGoal.projects.length > 3 && <p className="muted small">+{currentGoal.projects.length - 3} more</p>}
            </div>
            <div className="compare-section">
              <p className="compare-label">Certifications ({currentGoal.certifications.length})</p>
              {currentGoal.certifications.slice(0, 3).map((c) => (
                <p key={c.id} className="compare-item">{c.name}</p>
              ))}
              {currentGoal.certifications.length > 3 && <p className="muted small">+{currentGoal.certifications.length - 3} more</p>}
            </div>
          </div>

          <div className="compare-divider" />

          <div className="compare-col">
            <h4 className="compare-col-heading other">{comparePlan.goalPlan.name}</h4>
            <div className="compare-section">
              <p className="compare-label">Package Range</p>
              <p className="compare-value">{comparePlan.companyPlan?.packageEstimate?.range || "N/A"}</p>
            </div>
            <div className="compare-section">
              <p className="compare-label">Projects ({comparePlan.goalPlan.projects.length})</p>
              {comparePlan.goalPlan.projects.slice(0, 3).map((p) => (
                <p key={p.id} className="compare-item">
                  <span className={`value-tag ${p.resumeValue === "High" ? "high" : "medium"}`}>{p.resumeValue}</span> {p.title}
                </p>
              ))}
              {comparePlan.goalPlan.projects.length > 3 && <p className="muted small">+{comparePlan.goalPlan.projects.length - 3} more</p>}
            </div>
            <div className="compare-section">
              <p className="compare-label">Certifications ({comparePlan.goalPlan.certifications.length})</p>
              {comparePlan.goalPlan.certifications.slice(0, 3).map((c) => (
                <p key={c.id} className="compare-item">{c.name}</p>
              ))}
              {comparePlan.goalPlan.certifications.length > 3 && <p className="muted small">+{comparePlan.goalPlan.certifications.length - 3} more</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
