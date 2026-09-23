import { useCallback, useEffect, useRef, useState } from "react";
import { getGoals, getProgress, setProgress } from "../api.js";
import { FALLBACK_GOALS } from "../data/fallbackData.js";
import MockInterview from "./MockInterview.jsx";
import ResumeGuide from "./ResumeGuide.jsx";
import ScheduleView from "./ScheduleView.jsx";
import DonutChart from "./DonutChart.jsx";
import RadarChart from "./RadarChart.jsx";
import Confetti from "./Confetti.jsx";
import CompareGoals from "./CompareGoals.jsx";
import FloatingNav from "./FloatingNav.jsx";
import jsPDF from "jspdf";

const MILESTONES = [25, 50, 75, 100];

function ScrollReveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("visible"); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const delayClass = delay > 0 ? ` reveal-delay-${delay}` : "";
  return <div ref={ref} className={`reveal${delayClass} ${className}`}>{children}</div>;
}

function CustomCheckbox({ checked, onChange }) {
  return (
    <span className="custom-checkbox">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="check-box" />
    </span>
  );
}

function useTilt() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function handleMove(e) {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-2px)`;
    }
    function handleLeave() {
      el.style.transform = "";
    }
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);
  return ref;
}

function getCompanyDomain(company) {
  if (company.website) {
    try {
      return new URL(company.website).hostname;
    } catch { /* fall through */ }
  }
  const clean = company.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean + ".com";
}

function buildSkillsForRadar(companyPlan, goalPlan) {
  const skills = [];
  const allSkills = companyPlan.skills || [];
  if (allSkills.length >= 3) {
    allSkills.forEach((s) => {
      skills.push({
        name: s,
        required: 7 + Math.random() * 3,
        current: 2 + Math.random() * 5,
      });
    });
  } else if (goalPlan) {
    const defaults = ["DSA", "System Design", "Communication", "Projects", "Domain Knowledge"];
    defaults.forEach((s) => {
      skills.push({
        name: s,
        required: 6 + Math.random() * 4,
        current: 2 + Math.random() * 5,
      });
    });
  }
  return skills;
}

export default function RoadmapView({ user, onReset }) {
  const { companyPlan, goalPlan } = user.plan;
  const [completed, setCompleted] = useState(new Set());
  const [activeTab, setActiveTab] = useState(
    () => window.location.hash.replace("#", "") || "overview"
  );
  const [confetti, setConfetti] = useState(false);
  const [milestoneBanner, setMilestoneBanner] = useState("");
  const [shownMilestones, setShownMilestones] = useState(new Set());
  const [goals, setGoals] = useState(FALLBACK_GOALS);

  useEffect(() => {
    getProgress(user.userId).then((p) => setCompleted(new Set(p.completedItemIds)));
  }, [user]);

  useEffect(() => {
    getGoals()
      .then((data) => { if (Array.isArray(data) && data.length) setGoals(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      if (hash) setActiveTab(hash);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function goToTab(id) {
    setActiveTab(id);
    if (window.location.hash !== `#${id}`) window.location.hash = id;
  }

  const goalItems = goalPlan ? [...goalPlan.projects, ...goalPlan.certifications] : [];
  const doneGoalItems = goalItems.filter((i) => completed.has(i.id)).length;
  const progressPct = goalItems.length ? Math.round((doneGoalItems / goalItems.length) * 100) : 0;

  const checkMilestone = useCallback((pct) => {
    for (const m of MILESTONES) {
      if (pct >= m && !shownMilestones.has(m)) {
        setShownMilestones((prev) => new Set([...prev, m]));
        setConfetti(true);
        const messages = {
          25: "25% done! Great start!",
          50: "Halfway there! Keep going!",
          75: "75% complete! Almost there!",
          100: "100% — You crushed it!",
        };
        setMilestoneBanner(messages[m]);
        setTimeout(() => setMilestoneBanner(""), 3000);
        break;
      }
    }
  }, [shownMilestones]);

  async function toggle(itemId) {
    const isDone = completed.has(itemId);
    const updated = new Set(completed);
    if (isDone) updated.delete(itemId);
    else updated.add(itemId);
    setCompleted(updated);
    await setProgress(user.userId, itemId, !isDone);

    if (!isDone && goalItems.length) {
      const newDone = goalItems.filter((i) => updated.has(i.id)).length;
      const newPct = Math.round((newDone / goalItems.length) * 100);
      checkMilestone(newPct);
    }
  }

  const allCertifications = [
    ...(goalPlan ? goalPlan.certifications : []),
    ...(companyPlan.dreamCompany ? companyPlan.certifications : []),
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "companies", label: "Companies" },
  ];
  if (goalPlan) tabs.push({ id: "projects", label: "Projects" });
  if (allCertifications.length) tabs.push({ id: "certificates", label: "Certificates" });
  if (companyPlan.dreamCompany) tabs.push({ id: "target", label: companyPlan.dreamCompany });
  if (goalPlan) tabs.push({ id: "interview", label: "Mock Interview" });
  tabs.push({ id: "resume", label: "Resume Guide" });
  tabs.push({ id: "schedule", label: "Schedule" });

  useEffect(() => {
    if (!tabs.some((t) => t.id === activeTab)) goToTab("overview");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function exportFullPlan() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 16;
    let y = margin;

    function ensureSpace(needed) {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    }

    function heading(text) {
      ensureSpace(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(text, margin, y);
      y += 24;
    }

    function subheading(text) {
      ensureSpace(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(text, margin, y);
      y += 18;
    }

    function body(text) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const wrapped = doc.splitTextToSize(text, maxWidth);
      wrapped.forEach((line) => {
        ensureSpace(lineHeight);
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += 4;
    }

    function bullet(text) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const wrapped = doc.splitTextToSize(text, maxWidth - 16);
      wrapped.forEach((line, i) => {
        ensureSpace(lineHeight);
        doc.text(i === 0 ? "\u2022 " + line : "  " + line, margin + 8, y);
        y += lineHeight;
      });
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Pathforge Career Roadmap", margin, y);
    y += 30;
    body(`Name: ${user.name} | Branch: ${user.branch || "N/A"} | CGPA: ${companyPlan.cgpa}`);
    if (goalPlan) body(`Goal: ${goalPlan.name}`);
    if (companyPlan.dreamCompany) body(`Dream Company: ${companyPlan.dreamCompany}`);
    y += 10;

    heading("Package Estimate");
    body(`Range: ${companyPlan.packageEstimate.range}`);
    body(companyPlan.packageEstimate.note);
    y += 6;

    heading("Eligible Companies");
    companyPlan.eligibleCompanies.forEach((c) => {
      bullet(`${c.name} — ${c.domain} — ${c.packageRangeLPA[0]}-${c.packageRangeLPA[1]} LPA${c.eligible ? "" : " (needs CGPA " + c.minCGPA + "+)"}`);
    });
    y += 6;

    if (goalPlan) {
      heading(`Projects — ${goalPlan.name}`);
      goalPlan.projects.forEach((p) => {
        subheading(`${p.title} [${p.resumeValue} Value]`);
        body(`Tech: ${p.techStack}`);
        body(`Resume Bullet: ${p.bullet}`);
      });
      y += 6;

      heading("Certifications");
      goalPlan.certifications.forEach((c) => {
        bullet(`${c.name} — ${c.bullet}`);
      });
      y += 6;

      heading("Resume Tips");
      goalPlan.resumeTips.forEach((t) => bullet(t));
      y += 6;
    }

    if (companyPlan.dreamCompany && companyPlan.skills.length) {
      heading(`Target: ${companyPlan.dreamCompany}`);
      subheading("Key Skills");
      companyPlan.skills.forEach((s) => bullet(s));
    }

    heading("Progress");
    body(`${doneGoalItems} of ${goalItems.length} items completed (${progressPct}%)`);

    y += 16;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120);
    ensureSpace(20);
    doc.text("Generated by Pathforge Career Roadmap Builder", margin, y);

    doc.save(`${(user.name || "roadmap").replace(/\s+/g, "_")}_career_roadmap.pdf`);
  }

  const radarSkills = companyPlan.dreamCompany ? buildSkillsForRadar(companyPlan, goalPlan) : [];
  const packageTiltRef = useTilt();

  return (
    <div>
      <Confetti fire={confetti} onDone={() => setConfetti(false)} />
      {milestoneBanner && <div className="milestone-banner">{milestoneBanner}</div>}

      <div className="header-row">
        <div>
          <h2>Hi {user.name}, here's your plan</h2>
          <p className="subtitle">
            {user.branch} &bull; CGPA {companyPlan.cgpa}
            {goalPlan ? ` \u2022 Aiming to become a ${goalPlan.name}` : ""}
            {companyPlan.dreamCompany ? ` \u2022 Targeting ${companyPlan.dreamCompany}` : ""}
          </p>
        </div>
        <div className="header-actions" style={{ gap: 8 }}>
          <button className="export-btn ripple-btn" onClick={exportFullPlan}>Export PDF</button>
          <button className="secondary" onClick={onReset}>Start Over</button>
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={(e) => { e.preventDefault(); goToTab(t.id); }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* ---------------- OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="tab-content">
          <ScrollReveal>
            <div className="panel glow-border tilt-card" ref={packageTiltRef}>
              <h3 className="gradient-text" style={{ WebkitTextFillColor: "transparent", border: "none", padding: 0, margin: "0 0 16px" }}>Estimated Package Range</h3>
              <div className="package-card">
                <p className="package-range">{companyPlan.packageEstimate.range}</p>
                <p className="muted small">{companyPlan.packageEstimate.note}</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={1}>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-value">{companyPlan.eligibleCompanies.length}</div>
                <div className="stat-card-label">Companies Matched</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value">{goalItems.length}</div>
                <div className="stat-card-label">Tasks to Complete</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value">{companyPlan.cgpa}</div>
                <div className="stat-card-label">Your CGPA</div>
              </div>
              {goalPlan && (
                <div className="stat-card">
                  <div className="stat-card-value">{progressPct}%</div>
                  <div className="stat-card-label">Progress</div>
                </div>
              )}
            </div>
          </ScrollReveal>

          {goalPlan && (
            <ScrollReveal delay={2}>
              <div className="panel">
                <h3>Your Progress</h3>
                <DonutChart
                  percent={progressPct}
                  label="completed"
                />
                <div className="progress-bar-wrap">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="progress-label">{doneGoalItems} / {goalItems.length} items completed</p>
              </div>
            </ScrollReveal>
          )}

          {goalPlan && (
            <ScrollReveal delay={3}>
              <CompareGoals
                currentGoal={goalPlan}
                cgpa={companyPlan.cgpa}
                branch={user.branch}
                goals={goals}
              />
            </ScrollReveal>
          )}

          <ScrollReveal>
            <div className="panel cta-panel">
              <div className="cta-panel-text">
                <h3>Plan Your Days</h3>
                <p className="muted">Turn this roadmap into a day-by-day schedule based on your available weeks and hours.</p>
              </div>
              <a href="#schedule" className="btn-link ripple-btn" onClick={(e) => { e.preventDefault(); goToTab("schedule"); }}>
                Open Schedule &rarr;
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="panel">
              <h3>Top Matched Companies</h3>
              <div className="company-grid">
                {companyPlan.eligibleCompanies.slice(0, 6).map((c) => (
                  <CompanyCard key={c.id} c={c} />
                ))}
              </div>
              <p className="tab-hint">Open the <strong>Companies</strong> tab for the full list of {companyPlan.eligibleCompanies.length} matches.</p>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* ---------------- COMPANIES ---------------- */}
      {activeTab === "companies" && (
        <div className="tab-content">
          <div className="panel">
            <h3>Companies You Can Target</h3>
            {companyPlan.eligibleCompanies.length === 0 ? (
              <p className="muted">Focus on the Projects and Certificates tabs to build your profile, and aim to raise your CGPA above 6.0, the typical minimum cutoff.</p>
            ) : (
              <div className="company-grid">
                {companyPlan.eligibleCompanies.map((c) => (
                  <CompanyCard key={c.id} c={c} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- PROJECTS ---------------- */}
      {activeTab === "projects" && goalPlan && (
        <div className="tab-content">
          <div className="panel">
            <h3>Projects to Build — {goalPlan.name}</h3>
            {goalPlan.branchFit === false && (
              <ul className="detail-points">
                <li><strong>Branch Note:</strong> This goal is less common for {goalPlan.branch}, but fully achievable with extra self-study on the fundamentals.</li>
              </ul>
            )}
            <div className="item-list">
              {goalPlan.projects.map((p) => (
                <div key={p.id} className={`checklist-item ${completed.has(p.id) ? "done" : ""}`} onClick={() => toggle(p.id)}>
                  <CustomCheckbox checked={completed.has(p.id)} onChange={() => toggle(p.id)} />
                  <div>
                    <div className="item-title-row">
                      <ItemName url={p.url}>{p.title}</ItemName>
                      <span className={`value-tag ${p.resumeValue === "High" ? "high" : "medium"}`}>{p.resumeValue} resume value</span>
                    </div>
                    <ul className="detail-points">
                      <li><strong>Tech Stack:</strong> {p.techStack}</li>
                      <li><strong>Resume Bullet:</strong> {p.bullet}</li>
                    </ul>
                    <p className="uses-label">Why It's Useful</p>
                    <ul className="uses-list">
                      {p.uses.map((u, i) => <li key={i}>{u}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <h4>Resume Tips</h4>
            <ul className="tips-list">
              {goalPlan.resumeTips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* ---------------- CERTIFICATES ---------------- */}
      {activeTab === "certificates" && (
        <div className="tab-content">
          <div className="panel">
            <h3>Certifications Worth Doing</h3>
            <div className="item-list">
              {goalPlan && goalPlan.certifications.map((c) => (
                <div key={c.id} className={`checklist-item ${completed.has(c.id) ? "done" : ""}`} onClick={() => toggle(c.id)}>
                  <CustomCheckbox checked={completed.has(c.id)} onChange={() => toggle(c.id)} />
                  <div>
                    <ItemName url={c.url}>{c.name}</ItemName>
                    <ul className="detail-points">
                      <li><strong>Resume Bullet:</strong> {c.bullet}</li>
                    </ul>
                    <p className="uses-label">Why It's Useful</p>
                    <ul className="uses-list">
                      {c.uses.map((u, i) => <li key={i}>{u}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
              {companyPlan.dreamCompany && companyPlan.certifications.map((c) => (
                <div key={c.id} className={`checklist-item ${completed.has(c.id) ? "done" : ""}`} onClick={() => toggle(c.id)}>
                  <CustomCheckbox checked={completed.has(c.id)} onChange={() => toggle(c.id)} />
                  <div>
                    <ItemName url={c.url}>{c.name}</ItemName>
                    <ul className="detail-points">
                      <li><strong>Target:</strong> {companyPlan.dreamCompany}</li>
                      <li><strong>Resume Bullet:</strong> {c.bullet}</li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TARGET COMPANY ---------------- */}
      {activeTab === "target" && companyPlan.dreamCompany && (
        <div className="tab-content">
          <div className="panel">
            <h3>
              To Get Placed at {companyPlan.target?.website ? (
                <a href={companyPlan.target.website} target="_blank" rel="noopener noreferrer" className="link-strong">{companyPlan.dreamCompany} &nearr;</a>
              ) : companyPlan.dreamCompany}
              {companyPlan.target && (
                <span className={`eligibility-tag ${companyPlan.target.eligible ? "ok" : "warn"}`}>
                  {companyPlan.target.eligible ? "You meet the CGPA cutoff" : `Needs CGPA ${companyPlan.target.minCGPA}+`}
                </span>
              )}
            </h3>
            {!companyPlan.matched && (
              <ul className="detail-points">
                <li><strong>Note:</strong> "{companyPlan.dreamCompany}" isn't in our database yet — the guidance below is general. Research the company's actual tech stack and hiring process to refine it further.</li>
              </ul>
            )}

            {radarSkills.length >= 3 && (
              <>
                <h4>Skill Gap Analysis</h4>
                <RadarChart skills={radarSkills} />
              </>
            )}

            {companyPlan.skills.length > 0 && (
              <>
                <h4>Key Skills to Build</h4>
                <ul className="tips-list">
                  {companyPlan.skills.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </>
            )}
            <h4>Certifications & Projects</h4>
            <div className="item-list">
              {companyPlan.certifications.map((c) => (
                <div key={c.id} className={`checklist-item ${completed.has(c.id) ? "done" : ""}`} onClick={() => toggle(c.id)}>
                  <CustomCheckbox checked={completed.has(c.id)} onChange={() => toggle(c.id)} />
                  <div>
                    <ItemName url={c.url}>{c.name}</ItemName>
                    <ul className="detail-points">
                      <li><strong>Resume Bullet:</strong> {c.bullet}</li>
                    </ul>
                  </div>
                </div>
              ))}
              {companyPlan.projects.map((p) => (
                <div key={p.id} className={`checklist-item ${completed.has(p.id) ? "done" : ""}`} onClick={() => toggle(p.id)}>
                  <CustomCheckbox checked={completed.has(p.id)} onChange={() => toggle(p.id)} />
                  <div>
                    <ItemName url={p.url}>{p.title || p.name}</ItemName>
                    <ul className="detail-points">
                      <li><strong>Resume Bullet:</strong> {p.bullet}</li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MOCK INTERVIEW ---------------- */}
      {activeTab === "interview" && goalPlan && (
        <div className="tab-content">
          <div className="panel">
            <h3>Mock Interview Practice — {goalPlan.name}</h3>
            <MockInterview questions={goalPlan.interviewQuestions} />
          </div>
        </div>
      )}

      {/* ---------------- RESUME GUIDE ---------------- */}
      {activeTab === "resume" && (
        <div className="tab-content">
          <ResumeGuide />
        </div>
      )}

      {/* ---------------- SCHEDULE ---------------- */}
      {activeTab === "schedule" && (
        <div className="tab-content">
          <ScheduleView
            user={user}
            goalPlan={goalPlan}
            companyPlan={companyPlan}
            completed={completed}
            toggle={toggle}
          />
        </div>
      )}

      <FloatingNav tabs={tabs} activeTab={activeTab} onNavigate={goToTab} />
    </div>
  );
}

function ItemName({ url, children }) {
  if (!url) return <strong>{children}</strong>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link-strong">
      {children} <span className="ext-icon">&nearr;</span>
    </a>
  );
}

function CompanyCard({ c }) {
  const domain = getCompanyDomain(c);
  const [imgError, setImgError] = useState(false);
  const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  const tierClass = c.tier === 1 ? "tier-1" : c.tier === 2 ? "tier-2" : "tier-3";
  const tierLabel = c.tier === 1 ? "Tier 1" : c.tier === 2 ? "Tier 2" : "Tier 3";

  return (
    <div className={`company-card ${c.eligible === false ? "stretch" : ""}`}>
      <div className="company-logo-row">
        {!imgError ? (
          <img
            className="company-logo"
            src={logoUrl}
            alt=""
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span className="company-logo-fallback">{c.name[0]}</span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="item-title-row">
            {c.website ? (
              <a href={c.website} target="_blank" rel="noopener noreferrer" className="link-strong">{c.name} &nearr;</a>
            ) : (
              <strong>{c.name}</strong>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
        {c.tier && <span className={`tier-badge ${tierClass}`}>{tierLabel}</span>}
        {c.eligible === false && <span className="eligibility-tag warn">Needs CGPA {c.minCGPA}+</span>}
      </div>
      <span className="muted small">{c.domain}</span>
      <span className="package-tag">&#8377;{c.packageRangeLPA[0]}&ndash;{c.packageRangeLPA[1]} LPA</span>
    </div>
  );
}
