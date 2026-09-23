import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPANIES_FILE = path.join(__dirname, "data", "companies.json");
const GOALS_FILE = path.join(__dirname, "data", "goals.json");
const USERS_FILE = path.join(__dirname, "data", "users.json");
const PROGRESS_FILE = path.join(__dirname, "data", "progress.json");

for (const file of [USERS_FILE, PROGRESS_FILE]) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json());

// --- Reference data for dropdowns/autocomplete ---
app.get("/api/companies", (req, res) => {
  const companies = readJSON(COMPANIES_FILE);
  res.json(companies.map(({ id, name, tier, domain }) => ({ id, name, tier, domain })));
});

app.get("/api/goals", (req, res) => {
  const goals = readJSON(GOALS_FILE);
  res.json(goals.map(({ id, name, applicableBranches }) => ({ id, name, applicableBranches })));
});

// --- Company eligibility + package estimate (based on CGPA + optional dream company) ---
const MIN_SUGGESTED_COMPANIES = 10;

function buildCompanyPlan(cgpa, dreamCompany) {
  const companies = readJSON(COMPANIES_FILE);
  const cgpaNum = parseFloat(cgpa);

  const rated = companies.map((c) => ({ ...c, eligible: cgpaNum >= c.minCGPA }));

  const eligible = rated
    .filter((c) => c.eligible)
    .sort((a, b) => b.packageRangeLPA[1] - a.packageRangeLPA[1]);

  // Always keep at least 10 companies on screen — if fewer than 10 are eligible,
  // fill the rest with the closest reachable options so the list never looks thin.
  const stretch = rated
    .filter((c) => !c.eligible)
    .sort((a, b) => (a.minCGPA - cgpaNum) - (b.minCGPA - cgpaNum));

  const suggested = eligible.length >= MIN_SUGGESTED_COMPANIES
    ? eligible
    : [...eligible, ...stretch.slice(0, MIN_SUGGESTED_COMPANIES - eligible.length)];

  let packageEstimate;
  if (cgpaNum >= 8.5) packageEstimate = { range: "18 – 35 LPA", note: "Eligible for top-tier product companies. See the Companies tab for the full matched list." };
  else if (cgpaNum >= 7.5) packageEstimate = { range: "10 – 20 LPA", note: "Eligible for strong product and security-focused companies. See the Companies tab for the full matched list." };
  else if (cgpaNum >= 7) packageEstimate = { range: "6 – 12 LPA", note: "Eligible for solid IT, consulting, and security firms. See the Companies tab for the full matched list." };
  else if (cgpaNum >= 6) packageEstimate = { range: "3.5 – 8 LPA", note: "Eligible for mass-recruiting IT services companies. See the Companies tab for the full matched list." };
  else packageEstimate = { range: "Below typical cutoffs", note: "Most campus drives set a 6.0 CGPA minimum cutoff. Focus on raising CGPA; off-campus and skill-based hiring is still open regardless of CGPA." };

  const query = (dreamCompany || "").trim().toLowerCase();
  const target = query ? companies.find((c) => c.name.toLowerCase().includes(query) || query.includes(c.name.toLowerCase())) : null;

  let certifications = [], projects = [], skills = [], matched = false, eligibleForTarget = null;

  if (target) {
    matched = true;
    certifications = target.certifications;
    projects = target.projects;
    skills = target.skills;
    eligibleForTarget = cgpaNum >= target.minCGPA;
  } else if (dreamCompany) {
    skills = ["Data Structures & Algorithms", "Communication", "A tech stack aligned to the role"];
    certifications = [{ id: "generic-cert-1", name: "Certification aligned with the target company's core tech stack", bullet: "Completed a certification aligned with the target company's core technology" }];
    projects = [{ id: "generic-proj-1", title: "Domain-Relevant Capstone Project", bullet: "Built a project demonstrating skills relevant to the target company's domain" }];
  }

  return {
    cgpa: cgpaNum,
    dreamCompany: dreamCompany || null,
    eligibleCompanies: suggested.map((c) => ({ id: c.id, name: c.name, tier: c.tier, domain: c.domain, packageRangeLPA: c.packageRangeLPA, minCGPA: c.minCGPA, eligible: c.eligible, website: c.website })),
    packageEstimate,
    target: target ? { id: target.id, name: target.name, domain: target.domain, minCGPA: target.minCGPA, packageRangeLPA: target.packageRangeLPA, eligible: eligibleForTarget, website: target.website } : null,
    matched,
    skills, certifications, projects,
  };
}

// --- Goal-based plan: resume projects, certifications, tips, mock interview bank ---
function buildGoalPlan(goalId, branch) {
  if (!goalId) return null;
  const goals = readJSON(GOALS_FILE);
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return null;

  return {
    id: goal.id,
    name: goal.name,
    branchFit: branch ? goal.applicableBranches.includes(branch) : null,
    branch: branch || null,
    projects: goal.projects,
    certifications: goal.certifications,
    resumeTips: goal.resumeTips,
    interviewQuestions: goal.interviewQuestions,
  };
}

function buildFullPlan({ cgpa, dreamCompany, goal, branch }) {
  return {
    companyPlan: buildCompanyPlan(cgpa, dreamCompany),
    goalPlan: buildGoalPlan(goal, branch),
  };
}

app.post("/api/plan", (req, res) => {
  const { cgpa, dreamCompany, goal, branch } = req.body;
  if (cgpa === undefined || cgpa === null || cgpa === "") {
    return res.status(400).json({ error: "cgpa is required" });
  }
  res.json(buildFullPlan({ cgpa, dreamCompany, goal, branch }));
});

// --- Users (simple profile, no auth) ---
app.post("/api/users", (req, res) => {
  const { name, cgpa, dreamCompany, goal, branch, currentYear } = req.body;
  if (!name || cgpa === undefined || cgpa === "") {
    return res.status(400).json({ error: "name and cgpa are required" });
  }
  const users = readJSON(USERS_FILE);
  const userId = randomUUID();
  users[userId] = { name, cgpa, dreamCompany: dreamCompany || null, goal: goal || null, branch: branch || null, currentYear: currentYear || null, createdAt: new Date().toISOString() };
  writeJSON(USERS_FILE, users);

  const progress = readJSON(PROGRESS_FILE);
  progress[userId] = { completedItemIds: [] };
  writeJSON(PROGRESS_FILE, progress);

  res.json({ userId, ...users[userId], plan: buildFullPlan(users[userId]) });
});

app.get("/api/users/:userId", (req, res) => {
  const users = readJSON(USERS_FILE);
  const user = users[req.params.userId];
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ userId: req.params.userId, ...user, plan: buildFullPlan(user) });
});

// --- Progress tracking (checkboxes on certs/projects) ---
app.get("/api/progress/:userId", (req, res) => {
  const progress = readJSON(PROGRESS_FILE);
  const entry = progress[req.params.userId];
  if (!entry) return res.status(404).json({ error: "No progress found for this user" });
  res.json(entry);
});

app.post("/api/progress/:userId", (req, res) => {
  const { itemId, completed } = req.body;
  const progress = readJSON(PROGRESS_FILE);
  if (!progress[req.params.userId]) progress[req.params.userId] = { completedItemIds: [] };
  const entry = progress[req.params.userId];
  const set = new Set(entry.completedItemIds);
  if (completed) set.add(itemId);
  else set.delete(itemId);
  entry.completedItemIds = [...set];
  writeJSON(PROGRESS_FILE, progress);
  res.json(entry);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
