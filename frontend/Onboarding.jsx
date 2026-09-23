import { useEffect, useState } from "react";
import { createUser, getCompanies, getGoals } from "../api.js";
import { FALLBACK_GOALS, FALLBACK_COMPANIES } from "../data/fallbackData.js";

const BRANCHES = [
  "CSE", "IT", "ECE", "EEE", "Mechanical", "Civil",
  "Cybersecurity", "AI & Data Science", "AI & ML", "Chemical", "Aerospace",
  "Automobile", "Biotechnology", "Instrumentation", "Metallurgy", "Other",
];

const STEPS = [
  { id: 1, label: "About You" },
  { id: 2, label: "Academics" },
  { id: 3, label: "Your Goal" },
];

function StepIllustration({ step }) {
  if (step === 1) {
    return (
      <div className="step-illustration">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="28" r="14" fill="#2a52a3" opacity="0.15" />
          <circle cx="40" cy="28" r="10" fill="#2a52a3" opacity="0.3" />
          <path d="M20 62c0-11 9-20 20-20s20 9 20 20" stroke="#2a52a3" strokeWidth="3" fill="#2a52a3" opacity="0.1" strokeLinecap="round" />
          <circle cx="40" cy="28" r="6" fill="#2a52a3" />
          <path d="M34 26c0 0 2-4 6-4s6 4 6 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="37" cy="25" r="1" fill="#fff" />
          <circle cx="43" cy="25" r="1" fill="#fff" />
        </svg>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="step-illustration">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="14" y="18" width="52" height="44" rx="6" fill="#cf9a37" opacity="0.12" />
          <rect x="18" y="22" width="44" height="36" rx="4" fill="#cf9a37" opacity="0.08" stroke="#cf9a37" strokeWidth="2" />
          <line x1="26" y1="32" x2="54" y2="32" stroke="#cf9a37" strokeWidth="2" strokeLinecap="round" />
          <line x1="26" y1="40" x2="46" y2="40" stroke="#cf9a37" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="26" y1="48" x2="50" y2="48" stroke="#cf9a37" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
          <circle cx="58" cy="52" r="12" fill="#1f9d66" opacity="0.15" />
          <text x="58" y="56" textAnchor="middle" fill="#1f9d66" fontSize="12" fontWeight="800" fontFamily="sans-serif">A+</text>
        </svg>
      </div>
    );
  }
  return (
    <div className="step-illustration">
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="28" fill="#2a52a3" opacity="0.08" />
        <circle cx="40" cy="40" r="20" fill="#2a52a3" opacity="0.06" />
        <path d="M40 16 L44 28 L56 28 L46 36 L50 48 L40 40 L30 48 L34 36 L24 28 L36 28 Z" fill="#cf9a37" opacity="0.8" />
        <circle cx="40" cy="40" r="6" fill="#2a52a3" opacity="0.3" />
        <path d="M40 18v-6M40 68v-6M12 40h6M62 40h6" stroke="#2a52a3" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      </svg>
    </div>
  );
}

export default function Onboarding({ onComplete }) {
  const [companies, setCompanies] = useState(FALLBACK_COMPANIES);
  const [goals, setGoals] = useState(FALLBACK_GOALS);
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [currentYear, setCurrentYear] = useState(2);
  const [cgpa, setCgpa] = useState("");
  const [goal, setGoal] = useState(FALLBACK_GOALS[0].id);
  const [dreamCompany, setDreamCompany] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendOffline, setBackendOffline] = useState(false);

  useEffect(() => {
    getCompanies()
      .then((data) => { if (Array.isArray(data) && data.length) setCompanies(data); })
      .catch(() => setBackendOffline(true));

    getGoals()
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setGoals(data);
          setGoal(data[0].id);
        }
      })
      .catch(() => setBackendOffline(true));
  }, []);

  function validateStep(current) {
    if (current === 1) {
      if (!name.trim()) return "Please enter your name.";
    }
    if (current === 2) {
      const cgpaNum = parseFloat(cgpa);
      if (cgpa === "" || isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
        return "Please enter a valid CGPA between 0 and 10.";
      }
    }
    if (current === 3) {
      if (!goal) return "Please select what you want to become.";
    }
    return "";
  }

  function goNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep((s) => Math.min(STEPS.length, s + 1));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validateStep(3);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const cgpaNum = parseFloat(cgpa);
      const user = await createUser({ name, cgpa: cgpaNum, dreamCompany, goal, branch, currentYear });
      if (!user || !user.userId) throw new Error("no-userid");
      localStorage.setItem("userId", user.userId);
      setLoading(false);
      onComplete(user);
    } catch (err) {
      setLoading(false);
      setBackendOffline(true);
      setError("Couldn't reach the backend server. Start it with \"npm run dev\" inside the backend/ folder, then try again.");
    }
  }

  function handleFormKeyDown(e) {
    if (e.key === "Enter" && step < STEPS.length) {
      e.preventDefault();
      goNext();
    }
  }

  return (
    <div className="card">
      <h2>Tell us about yourself</h2>
      <p className="subtitle">Takes under a minute — we'll build your full plan instantly.</p>

      {backendOffline && (
        <p className="notice-box">
          Backend server not detected. The form still works, but your plan can't be generated
          until the backend is running — start it with <code>npm run dev</code> inside{" "}
          <code>backend/</code> on port 4000, then submit again.
        </p>
      )}

      <div className="step-indicator">
        {STEPS.map((s) => (
          <div key={s.id} className={`step-dot-wrap ${step === s.id ? "active" : ""} ${step > s.id ? "done" : ""}`}>
            <span className="step-dot">{step > s.id ? "\u2713" : s.id}</span>
            <span className="step-dot-label">{s.label}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
        {step === 1 && (
          <div className="step-page">
            <StepIllustration step={1} />
            <label>
              Your name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" required />
            </label>

            <label>
              Branch
              <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>

            <label>
              Current academic year
              <select value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))}>
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="step-page">
            <StepIllustration step={2} />
            <label>
              Current CGPA (out of 10)
              <input
                type="number" step="0.01" min="0" max="10"
                value={cgpa} onChange={(e) => setCgpa(e.target.value)}
                placeholder="Enter current CGPA" required
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="step-page">
            <StepIllustration step={3} />
            <label>
              What do you want to become?
              <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>

            <label>
              Dream company (optional)
              <input
                list="company-list"
                value={dreamCompany}
                onChange={(e) => setDreamCompany(e.target.value)}
                placeholder="Start typing to see suggestions"
              />
              <datalist id="company-list">
                {companies.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </label>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <div className="step-nav">
          {step > 1 && (
            <button type="button" className="secondary" onClick={goBack}>&larr; Back</button>
          )}
          {step < STEPS.length && (
            <button type="button" onClick={goNext}>Next &rarr;</button>
          )}
          {step === STEPS.length && (
            <button type="submit" disabled={loading}>
              {loading ? "Building your plan..." : "Generate My Roadmap"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
