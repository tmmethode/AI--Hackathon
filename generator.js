const fs = require("fs");

const firstNames = ["John", "Alice", "David", "Grace", "Michael", "Linda", "James", "Sarah", "Daniel", "Emma"];
const lastNames = ["Doe", "Smith", "Johnson", "Brown", "Williams", "Miller", "Wilson", "Moore", "Taylor", "Anderson"];

const skillsPool = ["JavaScript", "TypeScript", "Node.js", "React", "Next.js", "Python", "Django", "PostgreSQL", "MongoDB", "Docker"];
const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];

const companies = ["TechCorp", "Innova Ltd", "DevSolutions", "CodeBase", "FutureSoft"];
const roles = ["Frontend Engineer", "Backend Engineer", "Fullstack Developer"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSkills() {
  return Array.from({ length: 3 + Math.floor(Math.random() * 4) }).map(() => ({
    name: randomItem(skillsPool),
    level: randomItem(levels),
    yearsOfExperience: Math.floor(Math.random() * 5) + 1,
  }));
}

function generateCandidate(index) {
  const firstName = randomItem(firstNames);
  const lastName = randomItem(lastNames);

  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`,
    headline: "Software Engineer – Web & AI Systems",
    bio: "Passionate developer with experience in modern web technologies.",
    location: "Kigali, Rwanda",

    skills: randomSkills(),

    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
    ],

    experience: [
      {
        company: randomItem(companies),
        role: randomItem(roles),
        "Start Date": "2022-01",
        "End Date": "Present",
        description: "Worked on scalable web applications.",
        technologies: ["Node.js", "React"],
        "Is Current": true,
      },
    ],

    education: [
      {
        institution: "University of Rwanda",
        degree: "Bachelor's",
        "Field of Study": "Computer Science",
        "Start Year": 2019,
        "End Year": 2023,
      },
    ],

    certifications: [
      {
        name: "AWS Certified Developer",
        issuer: "Amazon",
        "Issue Date": "2023-06",
      },
    ],

    projects: [
      {
        name: "AI Recruitment System",
        description: "AI-powered candidate screening platform",
        technologies: ["Next.js", "Node.js"],
        role: "Backend Engineer",
        link: "https://github.com/example/project",
        "Start Date": "2023-01",
        "End Date": "2023-06",
      },
    ],

    availability: {
      status: "Open to Opportunities",
      type: "Full-time",
      "Start Date": "2026-05-01",
    },

    socialLinks: {
      linkedin: "https://linkedin.com/in/example",
      github: "https://github.com/example",
      portfolio: "https://portfolio.example.com",
    },
  };
}

const candidates = Array.from({ length: 100 }).map((_, i) =>
  generateCandidate(i + 1)
);

fs.writeFileSync("candidates.json", JSON.stringify(candidates, null, 2));

console.log("✅ 100 candidates generated → candidates.json");