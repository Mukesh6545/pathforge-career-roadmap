// Rule-based resume checker. Runs entirely in the browser on text the user
// pastes (or that we auto-extract from their uploaded PDF) — there's no AI
// model behind this, just pattern matching against their own roadmap data.

const ACTION_VERBS = [
  "built", "developed", "designed", "implemented", "led", "created", "optimized",
  "improved", "managed", "automated", "deployed", "analyzed", "reduced", "increased",
  "launched", "architected", "migrated", "integrated", "debugged", "tested",
];

const SECTION_PATTERNS = {
  Education: /education|b\.?\s?tech|degree|university|college/i,
  Experience: /experience|internship|intern\b/i,
  Projects: /projects?/i,
  Skills: /skills?|technologies/i,
  Certifications: /certificat/i,
};

export function collectTargetKeywords({ goalPlan, companyPlan }) {
  const set = new Set();
  if (companyPlan && companyPlan.skills) {
    companyPlan.skills.forEach((s) => set.add(String(s).toLowerCase().trim()));
  }
  const allProjects = [
    ...(goalPlan ? goalPlan.projects : []),
    ...(companyPlan && companyPlan.dreamCompany ? companyPlan.projects : []),
  ];
  allProjects.forEach((p) => {
    if (p.techStack) {
      p.techStack.split(/[,/&]/).forEach((t) => {
        const k = t.trim().toLowerCase();
        if (k && k.length > 1) set.add(k);
      });
    }
  });
  return [...set].filter(Boolean);
}

export function analyzeResumeText(text, targetKeywords) {
  const clean = (text || "").trim();
  const lower = clean.toLowerCase();
  const lines = clean.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const wordCount = clean ? clean.split(/\s+/).length : 0;

  const sectionsFound = [];
  const sectionsMissing = [];
  Object.entries(SECTION_PATTERNS).forEach(([label, pattern]) => {
    if (pattern.test(clean)) sectionsFound.push(label);
    else sectionsMissing.push(label);
  });

  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(clean);
  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(clean);

  const quantifiedLines = lines.filter((l) => /\d/.test(l)).length;
  const actionVerbHits = ACTION_VERBS.filter((v) => new RegExp(`\\b${v}\\b`, "i").test(clean));

  const matchedKeywords = targetKeywords.filter((k) => lower.includes(k));
  const missingKeywords = targetKeywords.filter((k) => !lower.includes(k));

  let score = 0;
  score += (sectionsFound.length / Math.max(1, Object.keys(SECTION_PATTERNS).length)) * 25;
  score += hasEmail ? 5 : 0;
  score += hasPhone ? 5 : 0;
  score += lines.length ? Math.min(20, (quantifiedLines / lines.length) * 40) : 0;
  score += Math.min(20, actionVerbHits.length * 3);
  score += targetKeywords.length
    ? Math.min(25, (matchedKeywords.length / targetKeywords.length) * 25)
    : 15;
  score = Math.round(Math.max(0, Math.min(100, score)));

  return {
    wordCount,
    totalLines: lines.length,
    sectionsFound,
    sectionsMissing,
    hasEmail,
    hasPhone,
    quantifiedLines,
    actionVerbHits,
    matchedKeywords,
    missingKeywords,
    score,
  };
}

export function buildImprovedResume({ originalText, analysis, goalPlan, companyPlan, userName }) {
  const original = (originalText || "").trim();
  const originalLower = original.toLowerCase();
  const lines = [];

  lines.push(userName || "Your Name");
  if (!analysis.hasEmail) lines.push("[Add your email address]");
  if (!analysis.hasPhone) lines.push("[Add your phone number]");
  lines.push("");

  lines.push("SUMMARY");
  const topSkills = analysis.matchedKeywords.slice(0, 5);
  lines.push(
    `Engineering student targeting a role as ${goalPlan ? goalPlan.name : "a strong industry role"}` +
      `${companyPlan && companyPlan.dreamCompany ? `, aiming for ${companyPlan.dreamCompany}` : ""}. ` +
      `${topSkills.length ? `Hands-on with ${topSkills.join(", ")}.` : "Building hands-on experience through projects and certifications."}`
  );
  lines.push("");

  lines.push("SKILLS");
  const allSkills = [...new Set([...analysis.matchedKeywords, ...analysis.missingKeywords])];
  lines.push(allSkills.length ? allSkills.join(", ") : "[List your key technical skills]");
  lines.push("");

  lines.push("PROJECTS");
  const projectSource = [
    ...(goalPlan ? goalPlan.projects : []),
    ...(companyPlan && companyPlan.dreamCompany ? companyPlan.projects : []),
  ];
  if (projectSource.length) {
    projectSource.forEach((p) => {
      const title = p.title || p.name;
      const already = title && originalLower.includes(title.toLowerCase());
      lines.push(`${title}${already ? "" : "  [suggested addition from your roadmap]"}`);
      lines.push(`- ${p.bullet}`);
    });
  } else {
    lines.push("[Add 2-3 strong projects with measurable outcomes]");
  }
  lines.push("");

  lines.push("CERTIFICATIONS");
  const certSource = [
    ...(goalPlan ? goalPlan.certifications : []),
    ...(companyPlan && companyPlan.dreamCompany ? companyPlan.certifications : []),
  ];
  if (certSource.length) {
    certSource.forEach((c) => {
      const already = c.name && originalLower.includes(c.name.toLowerCase());
      lines.push(`- ${c.name}${already ? "" : "  [suggested]"}`);
    });
  } else {
    lines.push("[Add certifications relevant to your goal]");
  }
  lines.push("");

  lines.push("EDUCATION");
  lines.push("[Your degree, college, CGPA, expected graduation year]");
  lines.push("");

  if (analysis.missingKeywords.length) {
    lines.push("GAPS TO CLOSE");
    lines.push(`Your resume doesn't yet mention: ${analysis.missingKeywords.join(", ")}. Add real experience with these where you can.`);
    lines.push("");
  }
  if (analysis.quantifiedLines < analysis.totalLines * 0.3) {
    lines.push("TIP: Add numbers to your bullets (users served, % improvement, time saved, dataset size) — quantified impact stands out far more than task descriptions.");
    lines.push("");
  }

  if (original) {
    lines.push("---");
    lines.push("YOUR ORIGINAL RESUME TEXT (for reference — merge the details above into this)");
    lines.push(original);
  }

  return lines.join("\n");
}
