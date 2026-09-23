# Pathforge – Placement Roadmap Builder

A full-stack web application that helps students create a personalized career and placement roadmap based on their academic details, career goal, and target company.

## Features

- Personalized career roadmap
- Company eligibility and package information
- Project recommendations for resume building
- Certification recommendations
- Resume guidance
- Company-specific preparation suggestions
- Mock interview practice
- Progress tracking
- Schedule and career planning
- PDF export of the generated roadmap

## Tech Stack

### Frontend

- React.js
- Vite
- JavaScript
- HTML
- CSS

### Backend

- Node.js
- Express.js
- JSON-based data storage

## Project Structure

```text
pathforge-career-roadmap/
│
├── frontend/
│   ├── src/
│   ├── App.jsx
│   ├── CompareGoals.jsx
│   ├── Confetti.jsx
│   ├── DonutChart.jsx
│   ├── FloatingNav.jsx
│   ├── MockInterview.jsx
│   ├── Onboarding.jsx
│   ├── RadarChart.jsx
│   ├── ResumeGuide.jsx
│   ├── RoadmapView.jsx
│   ├── ScheduleView.jsx
│   ├── api.js
│   ├── fallbackData.js
│   ├── index.css
│   ├── index.html
│   ├── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   ├── pdfText.js
│   ├── resumeAnalysis.js
│   ├── resumeSamples.js
│   └── vite.config.js
│
├── backend/
│   ├── data/
│   │   ├── companies.json
│   │   ├── goals.json
│   │   ├── progress.json
│   │   └── users.json
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── screenshots/
│   ├── onboarding.png
│   ├── dashboard.png
│   ├── companies.png
│   └── mock-interview.png
│
└── README.md
