// Local fallback copies of goals/companies used ONLY if the backend API
// (http://localhost:4000) is unreachable — so the form never renders empty.
// The backend's /api/goals and /api/companies are still the source of truth
// whenever the server is running; this is purely a safety net.

export const FALLBACK_GOALS = [
  { id: "sde", name: "Software Development Engineer (SDE)" },
  { id: "data-science", name: "Data Scientist / ML Engineer" },
  { id: "cybersecurity", name: "Cybersecurity Analyst" },
  { id: "cloud-devops", name: "Cloud / DevOps Engineer" },
  { id: "core-engineering", name: "Core Engineering (Non-CS roles)" },
];

export const FALLBACK_COMPANIES = [
  { id: "google", name: "Google" },
  { id: "microsoft", name: "Microsoft" },
  { id: "amazon", name: "Amazon" },
  { id: "meta", name: "Meta" },
  { id: "apple", name: "Apple" },
  { id: "adobe", name: "Adobe" },
  { id: "flipkart", name: "Flipkart" },
  { id: "goldman-sachs", name: "Goldman Sachs" },
  { id: "oracle", name: "Oracle" },
  { id: "sap-labs", name: "SAP Labs" },
  { id: "salesforce", name: "Salesforce" },
  { id: "intel", name: "Intel" },
  { id: "qualcomm", name: "Qualcomm" },
  { id: "cisco", name: "Cisco" },
  { id: "paloalto", name: "Palo Alto Networks" },
  { id: "crowdstrike", name: "CrowdStrike" },
  { id: "zoho", name: "Zoho" },
  { id: "freshworks", name: "Freshworks" },
  { id: "ibm", name: "IBM" },
  { id: "deloitte", name: "Deloitte" },
  { id: "ey", name: "EY" },
  { id: "accenture", name: "Accenture" },
  { id: "tcs-digital", name: "TCS Digital" },
  { id: "capgemini", name: "Capgemini" },
  { id: "hcltech", name: "HCLTech" },
  { id: "tech-mahindra", name: "Tech Mahindra" },
  { id: "ltimindtree", name: "LTIMindtree" },
  { id: "wipro", name: "Wipro" },
  { id: "infosys", name: "Infosys" },
  { id: "cognizant", name: "Cognizant" },
  { id: "tcs", name: "TCS" },
];
