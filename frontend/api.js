const BASE = "/api";

export async function getCompanies() {
  const res = await fetch(`${BASE}/companies`);
  return res.json();
}

export async function getGoals() {
  const res = await fetch(`${BASE}/goals`);
  return res.json();
}

export async function createUser({ name, cgpa, dreamCompany, goal, branch, currentYear }) {
  const res = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, cgpa, dreamCompany, goal, branch, currentYear }),
  });
  return res.json();
}

export async function getProgress(userId) {
  const res = await fetch(`${BASE}/progress/${userId}`);
  return res.json();
}

export async function setProgress(userId, itemId, completed) {
  const res = await fetch(`${BASE}/progress/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, completed }),
  });
  return res.json();
}
