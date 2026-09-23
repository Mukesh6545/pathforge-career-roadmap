import { useState } from "react";
import { RESUME_SAMPLES } from "../data/resumeSamples.js";

const BUILD_TIPS = [
  "Keep it to one page until you have 2+ years of experience",
  "Use reverse-chronological order — most recent first",
  "Lead every bullet with an action verb (Built, Designed, Automated, Reduced)",
  "Quantify results wherever possible — percentages, numbers, time saved",
  "Match keywords from the job description — many resumes are filtered by ATS software first",
  "Use a clean, single-column layout — tables and graphics often break ATS parsing",
  "Proofread for consistent tense and formatting before sending",
];

export default function ResumeGuide() {
  const [active, setActive] = useState(RESUME_SAMPLES[0].id);
  const sample = RESUME_SAMPLES.find((r) => r.id === active);

  return (
    <div className="panel">
      <h3>How to Build a Resume</h3>
      <ul className="tips-list">
        {BUILD_TIPS.map((t, i) => <li key={i}>{t}</li>)}
      </ul>

      <h4>Reference Resumes — Pick a Track</h4>
      <div className="tab-bar sub-tab-bar">
        {RESUME_SAMPLES.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`tab-btn ${active === r.id ? "active" : ""}`}
            onClick={() => setActive(r.id)}
          >
            {r.track}
          </button>
        ))}
      </div>

      <div className="resume-sample">
        <ul className="detail-points">
          <li><strong>Education:</strong> {sample.education}</li>
          <li><strong>Skills:</strong> {sample.skills}</li>
        </ul>

        <h4>Projects</h4>
        {sample.projects.map((p, i) => (
          <div key={i} className="resume-sample-block">
            <strong>{p.title}</strong>
            <ul className="detail-points">
              {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
            </ul>
          </div>
        ))}

        <h4>Certifications</h4>
        <ul className="tips-list">
          {sample.certifications.map((c, i) => <li key={i}>{c}</li>)}
        </ul>

        <h4>Achievements</h4>
        <ul className="tips-list">
          {sample.achievements.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      </div>
    </div>
  );
}
