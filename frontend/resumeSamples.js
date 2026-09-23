// Reference resume outlines shown in the Resume Guide tab.
// These are original sample structures for students to model their own
// resume on — not real people's resumes.

export const RESUME_SAMPLES = [
  {
    id: "sde",
    track: "SDE / Full-Stack",
    education: "B.Tech, Computer Science — Final Year, CGPA 8.2",
    skills: "Java, Python, JavaScript, React, Node.js, MongoDB, Git, Docker",
    projects: [
      {
        title: "Full-Stack E-commerce App",
        bullets: [
          "Built a full-stack e-commerce app with auth, cart, and order management using React, Node.js, and MongoDB",
          "Reduced average page load time by 35% through code splitting and lazy-loading",
        ],
      },
      {
        title: "DSA Problem-Solving Portfolio",
        bullets: [
          "Solved 200+ DSA problems on LeetCode/Codeforces, documented with explanations on GitHub",
          "Ranked in the top 15% across 3 competitive programming contests",
        ],
      },
    ],
    certifications: ["Meta Front-End Developer Professional Certificate", "AWS Certified Cloud Practitioner"],
    achievements: ["Winner, college-level hackathon", "Core member, Coding Club — ran 2 workshops for 100+ students"],
  },
  {
    id: "data-science",
    track: "Data Science / ML",
    education: "B.Tech, AI & Data Science — Final Year, CGPA 8.5",
    skills: "Python, SQL, Pandas, scikit-learn, PyTorch, Power BI, FastAPI",
    projects: [
      {
        title: "End-to-End ML Pipeline",
        bullets: [
          "Built and deployed an ML pipeline (data cleaning → training → REST API) using scikit-learn and FastAPI",
          "Achieved 91% model accuracy on a held-out test set",
        ],
      },
      {
        title: "Data Visualization Dashboard",
        bullets: [
          "Built an interactive dashboard visualizing key business metrics using Power BI",
          "Used by 3 student clubs to track event engagement metrics",
        ],
      },
    ],
    certifications: ["IBM Data Science Professional Certificate", "Google Data Analytics Professional Certificate"],
    achievements: ["Top 10% finish, Kaggle competition", "Published a technical blog series on ML fundamentals"],
  },
  {
    id: "cybersecurity",
    track: "Cybersecurity Analyst",
    education: "B.Tech, Cybersecurity — Final Year, CGPA 7.9",
    skills: "Networking, Linux, Python, Wireshark, Splunk, Nmap, Metasploit",
    projects: [
      {
        title: "Home SOC Lab",
        bullets: [
          "Built a home Security Operations Center lab using Splunk/ELK for log analysis and threat detection",
          "Detected and documented 5 simulated attack scenarios end-to-end",
        ],
      },
      {
        title: "Vulnerability Scanner",
        bullets: [
          "Developed a Python-based network vulnerability scanner identifying open ports and known CVEs",
          "Scanned 50+ test hosts, cutting manual audit time significantly",
        ],
      },
    ],
    certifications: ["CompTIA Security+", "Google Cybersecurity Professional Certificate"],
    achievements: ["Completed 15+ CTF writeups (TryHackMe/HackTheBox)", "Volunteer, campus security awareness drive"],
  },
  {
    id: "core-engineering",
    track: "Core Engineering",
    education: "B.Tech, Mechanical Engineering — Final Year, CGPA 8.0",
    skills: "SolidWorks, AutoCAD, MATLAB, ANSYS, GD&T, Six Sigma basics",
    projects: [
      {
        title: "CAD Design Project",
        bullets: [
          "Designed and modeled a mechanical component in SolidWorks, including tolerance stack-up and stress analysis",
          "Reduced material usage by 12% while meeting load requirements",
        ],
      },
      {
        title: "Automation / Robotics Mini Project",
        bullets: [
          "Built an automated control system using Arduino and sensors, demonstrating real-time control logic",
          "Presented the prototype at the college technical symposium",
        ],
      },
    ],
    certifications: ["Certified SolidWorks Associate (CSWA)", "NPTEL Certification (branch-relevant)"],
    achievements: ["2-month industry internship — documented shop-floor process improvements", "Team lead, final year capstone project"],
  },
];
