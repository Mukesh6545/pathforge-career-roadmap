import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { extractPdfText } from "../utils/pdfText.js";
import { collectTargetKeywords, analyzeResumeText, buildImprovedResume } from "../utils/resumeAnalysis.js";

const STORAGE_PREFIX = "pathforge_schedule_";
const RESUME_PREFIX = "pathforge_resume_";
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

function hoursForProject(p) {
  return p.resumeValue === "High" ? 18 : 12;
}
function hoursForCert() {
  return 8;
}

function buildTasks({ goalPlan, companyPlan }) {
  const tasks = [];

  const certs = [
    ...(goalPlan ? goalPlan.certifications.map((c) => ({ ...c, source: "goal" })) : []),
    ...(companyPlan.dreamCompany ? companyPlan.certifications.map((c) => ({ ...c, source: "company" })) : []),
  ];
  const projects = [
    ...(goalPlan ? goalPlan.projects.map((p) => ({ ...p, source: "goal" })) : []),
    ...(companyPlan.dreamCompany ? companyPlan.projects.map((p) => ({ ...p, source: "company" })) : []),
  ].sort((a, b) => (a.resumeValue === "High" ? -1 : 1) - (b.resumeValue === "High" ? -1 : 1));

  certs.forEach((c) => {
    tasks.push({ id: c.id, label: c.name, hours: hoursForCert(), type: "certification" });
  });

  projects.forEach((p) => {
    tasks.push({ id: p.id, label: p.title || p.name, hours: hoursForProject(p), type: "project" });
  });

  if (goalPlan && goalPlan.interviewQuestions && goalPlan.interviewQuestions.length) {
    tasks.push({
      id: "schedule-interview-prep",
      label: `Mock Interview Practice — ${goalPlan.name}`,
      hours: Math.max(4, Math.min(10, Math.round(goalPlan.interviewQuestions.length * 0.5))),
      type: "interview",
    });
  }

  tasks.push({ id: "schedule-resume-polish", label: "Resume Building & Final Polish", hours: 4, type: "resume" });

  return tasks;
}

function buildSchedule({ tasks, weeks, hoursPerDay }) {
  const totalDays = weeks * 7;
  const queue = tasks.map((t) => ({ ...t, remaining: t.hours }));
  const days = [];

  let qi = 0;
  for (let d = 0; d < totalDays && qi < queue.length; d++) {
    let budget = hoursPerDay;
    const dayItems = [];
    while (budget > 0.01 && qi < queue.length) {
      const task = queue[qi];
      const chunk = Math.min(budget, task.remaining);
      if (chunk <= 0) { qi++; continue; }
      dayItems.push({
        id: task.id,
        label: task.label,
        type: task.type,
        hours: Math.round(chunk * 10) / 10,
        continued: task.hours !== task.remaining,
        willContinue: task.remaining - chunk > 0.01,
      });
      task.remaining -= chunk;
      budget -= chunk;
      if (task.remaining <= 0.01) qi++;
    }
    days.push({ dayNumber: d + 1, items: dayItems, freeDay: dayItems.length === 0 });
  }

  for (let d = days.length; d < totalDays; d++) {
    days.push({ dayNumber: d + 1, items: [], freeDay: true });
  }

  const unscheduled = queue.filter((t) => t.remaining > 0.01);
  return { days, unscheduled };
}

const TYPE_LABEL = {
  certification: "Certification",
  project: "Project",
  interview: "Interview Prep",
  resume: "Resume",
};

export default function ScheduleView({ user, goalPlan, companyPlan, completed, toggle }) {
  const storageKey = STORAGE_PREFIX + user.userId;
  const resumeKey = RESUME_PREFIX + user.userId;
  const [weeksInput, setWeeksInput] = useState("8");
  const [hoursInput, setHoursInput] = useState("2");
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [resume, setResume] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [extractNote, setExtractNote] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [draft, setDraft] = useState("");
  const [expandedWeeks, setExpandedWeeks] = useState(new Set([0]));

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        setWeeksInput(String(parsed.weeks));
        setHoursInput(String(parsed.hoursPerDay));
      } catch { /* ignore */ }
    }
    const savedResume = localStorage.getItem(resumeKey);
    if (savedResume) {
      try { setResume(JSON.parse(savedResume)); } catch { /* ignore */ }
    }
  }, [storageKey, resumeKey]);

  function toggleWeek(wi) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(wi)) next.delete(wi); else next.add(wi);
      return next;
    });
  }

  function handleResumeChange(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setResumeError("");
    if (file.type !== "application/pdf") { setResumeError("Please upload a PDF file."); return; }
    if (file.size > MAX_RESUME_BYTES) { setResumeError("That file is too large — please upload a PDF under 5MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const record = { name: file.name, size: file.size, dataUrl: reader.result };
      setResume(record);
      setAnalysis(null);
      setDraft("");
      try { localStorage.setItem(resumeKey, JSON.stringify(record)); } catch { setResumeError("Couldn't save the file."); }
      setExtractNote("Reading text from your PDF...");
      extractPdfText(record.dataUrl)
        .then((text) => {
          if (text) { setResumeText(text); setExtractNote(""); }
          else { setExtractNote("Couldn't find selectable text — please paste your resume text below."); }
        })
        .catch(() => { setExtractNote("Couldn't auto-read this PDF — please paste your resume text below."); });
    };
    reader.onerror = () => setResumeError("Couldn't read that file — please try again.");
    reader.readAsDataURL(file);
  }

  function handleRemoveResume() { setResume(null); setResumeError(""); localStorage.removeItem(resumeKey); }

  function handleAnalyzeResume() {
    const keywords = collectTargetKeywords({ goalPlan, companyPlan });
    const result = analyzeResumeText(resumeText, keywords);
    setAnalysis(result);
    setDraft("");
  }

  function handleGenerateDraft() {
    if (!analysis) return;
    const improved = buildImprovedResume({ originalText: resumeText, analysis, goalPlan, companyPlan, userName: user.name });
    setDraft(improved);
  }

  function handleDownloadDraft() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    const bodySize = 11;
    const headingSize = 13;
    const lineHeight = 15;
    let y = margin;

    draft.split("\n").forEach((rawLine) => {
      const trimmed = rawLine.trim();
      const isHeading = trimmed.length > 0 && trimmed.length < 40 && /[A-Z]/.test(trimmed) && !/[a-z]/.test(trimmed);
      doc.setFont("helvetica", isHeading ? "bold" : "normal");
      doc.setFontSize(isHeading ? headingSize : bodySize);

      const wrapped = doc.splitTextToSize(rawLine || " ", maxWidth);
      wrapped.forEach((line) => {
        if (y > pageHeight - margin) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += lineHeight;
      });
      if (isHeading) y += 4;
    });

    doc.save(`${(user.name || "resume").replace(/\s+/g, "_")}_resume_draft.pdf`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const weeks = Number(weeksInput);
    const hoursPerDay = Number(hoursInput);
    if (!weeks || weeks < 1 || weeks > 52) { setError("Enter a number of weeks between 1 and 52."); return; }
    if (!hoursPerDay || hoursPerDay < 0.5 || hoursPerDay > 16) { setError("Enter daily hours between 0.5 and 16."); return; }
    setError("");
    const next = { weeks, hoursPerDay };
    setSettings(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function handleEdit() { setSettings(null); }

  const resumeSection = (
    <div className="resume-upload-box">
      <div className="item-title-row" style={{ justifyContent: "space-between", width: "100%" }}>
        <strong>Your Resume</strong>
        <span className="value-tag medium">Optional</span>
      </div>
      <p className="muted small" style={{ marginTop: 6 }}>
        Upload your resume PDF and/or paste its text below to get a quick health check against your
        goal — completely optional, your schedule works fine without it.
      </p>
      {resume ? (
        <div className="resume-current-row">
          <a href={resume.dataUrl} download={resume.name} className="link-strong">
            {resume.name} &nearr;
          </a>
          <span className="muted small">({Math.round(resume.size / 1024)} KB)</span>
          <button type="button" className="secondary" onClick={handleRemoveResume}>Remove</button>
        </div>
      ) : (
        <input type="file" accept="application/pdf" onChange={handleResumeChange} />
      )}
      {resumeError && <p className="error">{resumeError}</p>}

      <label style={{ marginTop: 16, display: "block" }}>
        Resume text (auto-filled from your PDF when possible — feel free to paste or edit it)
        <textarea
          rows={7}
          value={resumeText}
          onChange={(e) => { setResumeText(e.target.value); setAnalysis(null); setDraft(""); }}
          placeholder="Paste your resume text here..."
        />
      </label>
      {extractNote && <p className="muted small">{extractNote}</p>}

      <button type="button" style={{ marginTop: 10 }} onClick={handleAnalyzeResume} disabled={!resumeText.trim()}>
        Submit for Analysis
      </button>

      {analysis && (
        <div style={{ marginTop: 20 }}>
          <div className="score-summary">
            <div className="score-big">{analysis.score}/100</div>
            <p className="score-sub">Resume health score — sections, contact info, impact, and keyword match vs. your goal</p>
          </div>
          <ul className="detail-points">
            <li><strong>Sections found:</strong> {analysis.sectionsFound.length ? analysis.sectionsFound.join(", ") : "none clearly detected"}</li>
            {analysis.sectionsMissing.length > 0 && <li><strong>Missing sections:</strong> {analysis.sectionsMissing.join(", ")}</li>}
            <li><strong>Contact info:</strong> {analysis.hasEmail ? "email found" : "email missing"} &middot; {analysis.hasPhone ? "phone found" : "phone missing"}</li>
            <li><strong>Quantified bullets:</strong> {analysis.quantifiedLines} of {analysis.totalLines} lines include a number — add more measurable outcomes for stronger impact.</li>
            <li><strong>Action verbs used:</strong> {analysis.actionVerbHits.length ? analysis.actionVerbHits.join(", ") : "none detected — start bullets with verbs like Built, Led, Improved"}</li>
            {analysis.missingKeywords.length > 0 && <li><strong>Missing keywords for your goal:</strong> {analysis.missingKeywords.join(", ")}</li>}
          </ul>
          <button type="button" className="secondary" onClick={handleGenerateDraft}>Generate Improved Resume Draft</button>
        </div>
      )}

      {draft && (
        <div style={{ marginTop: 20 }}>
          <label>
            Your improved resume draft (edit freely before downloading)
            <textarea rows={16} value={draft} onChange={(e) => setDraft(e.target.value)} style={{ fontFamily: "var(--font-mono)", fontSize: 13 }} />
          </label>
          <button type="button" style={{ marginTop: 10 }} onClick={handleDownloadDraft}>Download Draft (.pdf)</button>
          <p className="disclaimer">
            This draft is built from rule-based checks and your roadmap data, not real AI writing — treat
            it as a structured starting point, then edit it in your own words.
          </p>
        </div>
      )}
    </div>
  );

  if (!settings) {
    return (
      <div className="panel">
        <h3>Build Your Day-by-Day Schedule</h3>
        <p className="muted">
          Tell us how much time you can give, and we'll turn your projects, certifications, and
          interview prep into a plan you can follow day by day.
        </p>
        <form onSubmit={handleSubmit} style={{ maxWidth: 360, marginTop: 18 }}>
          <label>
            How many weeks do you want to prepare for?
            <input type="number" min="1" max="52" value={weeksInput} onChange={(e) => setWeeksInput(e.target.value)} placeholder="e.g. 8" />
          </label>
          <label style={{ marginTop: 16, display: "block" }}>
            How many hours can you give per day?
            <input type="number" min="0.5" max="16" step="0.5" value={hoursInput} onChange={(e) => setHoursInput(e.target.value)} placeholder="e.g. 2" />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" style={{ marginTop: 18 }}>Generate My Schedule</button>
        </form>
        <div style={{ maxWidth: 360 }}>{resumeSection}</div>
      </div>
    );
  }

  const tasks = buildTasks({ goalPlan, companyPlan });
  const { days, unscheduled } = buildSchedule({ tasks, weeks: settings.weeks, hoursPerDay: settings.hoursPerDay });
  const totalTaskHours = tasks.reduce((s, t) => s + t.hours, 0);
  const totalAvailableHours = settings.weeks * 7 * settings.hoursPerDay;

  const weekGroups = [];
  for (let w = 0; w < settings.weeks; w++) {
    weekGroups.push(days.slice(w * 7, w * 7 + 7));
  }

  return (
    <div className="panel">
      <div className="item-title-row" style={{ justifyContent: "space-between", width: "100%" }}>
        <h3 style={{ margin: 0 }}>Your Schedule</h3>
        <button type="button" className="secondary" onClick={handleEdit}>Edit Weeks / Hours</button>
      </div>
      <p className="muted">
        {settings.weeks} week{settings.weeks > 1 ? "s" : ""} &bull; {settings.hoursPerDay} hr/day &bull;{" "}
        {Math.round(totalAvailableHours)} total hours available, ~{Math.round(totalTaskHours)} hours of work planned.
      </p>

      <div className="timeline-legend">
        <span className="timeline-legend-item"><span className="timeline-legend-dot" style={{ background: "var(--gold-500)" }} /> Certification</span>
        <span className="timeline-legend-item"><span className="timeline-legend-dot" style={{ background: "var(--navy-600)" }} /> Project</span>
        <span className="timeline-legend-item"><span className="timeline-legend-dot" style={{ background: "var(--green-600)" }} /> Interview</span>
        <span className="timeline-legend-item"><span className="timeline-legend-dot" style={{ background: "var(--purple-600)" }} /> Resume</span>
      </div>

      {resumeSection}

      {unscheduled.length > 0 && (
        <ul className="detail-points">
          <li>
            <strong>Heads up:</strong> at this pace, {unscheduled.length} item{unscheduled.length > 1 ? "s" : ""} won't fit in {settings.weeks} weeks.
            Increase your weeks or hours per day, or trim your goal list, to cover everything.
          </li>
        </ul>
      )}

      {weekGroups.map((weekDays, wi) => (
        <div key={wi} className="year-block">
          <h4
            style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 8 }}
            onClick={() => toggleWeek(wi)}
          >
            <span style={{ transition: "transform 0.2s", transform: expandedWeeks.has(wi) ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>
              &#9654;
            </span>
            Week {wi + 1}
            <span className="muted small" style={{ fontWeight: 400, marginLeft: 8, textTransform: "none", letterSpacing: "normal" }}>
              {weekDays.filter((d) => !d.freeDay).length} active days
            </span>
          </h4>

          {expandedWeeks.has(wi) && (
            <div className="timeline">
              {weekDays.map((day) => {
                const primaryType = day.freeDay ? "free" : (day.items[0]?.type || "project");
                return (
                  <div key={day.dayNumber} className="timeline-node">
                    <span className={`timeline-dot type-${primaryType}`} />
                    <div className={`timeline-card ${day.freeDay ? "free-day" : ""}`}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span className="timeline-day-label">Day {day.dayNumber}</span>
                        {day.freeDay && <span className="value-tag medium">Free / Revision Day</span>}
                        {!day.freeDay && day.items.map((it, idx) => (
                          <span key={idx} className={`timeline-type-tag type-${it.type}`}>{TYPE_LABEL[it.type]}</span>
                        ))}
                      </div>
                      {day.freeDay ? (
                        <p className="muted small" style={{ marginTop: 4 }}>No new items — revise, catch up, or get ahead.</p>
                      ) : (
                        <ul className="detail-points" style={{ marginTop: 6 }}>
                          {day.items.map((it, idx) => (
                            <li key={idx}>
                              <strong>{it.label}</strong> — {it.hours} hr
                              {it.continued && !it.willContinue ? " (finish)" : ""}
                              {it.willContinue ? " (continues tomorrow)" : ""}
                              {completed && completed.has(it.id) && !["schedule-interview-prep", "schedule-resume-polish"].includes(it.id)
                                ? " \u2713 done"
                                : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <p className="tab-hint">
        Tip: mark items done from the Projects, Certificates, or target company tabs — your progress
        bar on the Overview tab updates automatically.
      </p>
    </div>
  );
}
