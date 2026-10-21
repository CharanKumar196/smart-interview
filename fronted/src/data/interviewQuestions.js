// ==========================================
// SMART INTERVIEW - EXPANDED QUESTION BANK
// ==========================================

const technicalTopics = {
  "Frontend Developer": [
    "HTML semantics",
    "CSS box model",
    "Flexbox",
    "CSS Grid",
    "responsive design",
    "JavaScript variables",
    "JavaScript closures",
    "DOM manipulation",
    "event bubbling",
    "Promises",
    "async and await",
    "React components",
    "JSX",
    "React props",
    "React state",
    "React Hooks",
    "useEffect",
    "Virtual DOM",
    "React reconciliation",
    "React performance",
    "memoization",
    "form validation",
    "accessibility",
    "web performance",
    "frontend security",
  ],

  "Backend Developer": [
    "Node.js",
    "Express.js",
    "REST APIs",
    "HTTP methods",
    "HTTP status codes",
    "middleware",
    "authentication",
    "authorization",
    "JWT",
    "password hashing",
    "input validation",
    "error handling",
    "asynchronous programming",
    "Promises",
    "event loop",
    "SQL databases",
    "NoSQL databases",
    "database indexing",
    "database transactions",
    "API rate limiting",
    "caching",
    "API security",
    "logging",
    "scalability",
    "deployment",
  ],

  "Full Stack Developer": [
    "frontend development",
    "backend development",
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Node.js",
    "Express.js",
    "REST APIs",
    "HTTP",
    "CRUD operations",
    "SQL databases",
    "NoSQL databases",
    "database relationships",
    "authentication",
    "authorization",
    "JWT",
    "form validation",
    "API error handling",
    "state management",
    "file uploads",
    "Git",
    "deployment",
    "application security",
    "system scalability",
  ],

  "Cloud Computing": [
    "cloud computing",
    "AWS EC2",
    "Amazon S3",
    "AWS IAM",
    "AWS VPC",
    "Availability Zones",
    "AWS Regions",
    "load balancing",
    "Auto Scaling",
    "Amazon RDS",
    "AWS Lambda",
    "CloudWatch",
    "cloud storage",
    "cloud networking",
    "cloud security",
    "least privilege access",
    "cloud backups",
    "disaster recovery",
    "high availability",
    "fault tolerance",
    "containerization",
    "Docker",
    "Kubernetes",
    "cloud cost optimization",
    "infrastructure as code",
  ],

  "Software Tester": [
    "software testing",
    "test cases",
    "test scenarios",
    "bug life cycle",
    "severity and priority",
    "verification and validation",
    "smoke testing",
    "sanity testing",
    "regression testing",
    "integration testing",
    "system testing",
    "acceptance testing",
    "boundary value analysis",
    "equivalence partitioning",
    "decision table testing",
    "state transition testing",
    "exploratory testing",
    "test data",
    "test documentation",
    "defect reporting",
    "risk-based testing",
    "API testing",
    "performance testing",
    "test automation",
    "continuous integration",
  ],

  "Data Analyst": [
    "SQL",
    "primary keys",
    "foreign keys",
    "SQL joins",
    "GROUP BY",
    "HAVING",
    "aggregate functions",
    "subqueries",
    "window functions",
    "database normalization",
    "data cleaning",
    "missing values",
    "duplicate records",
    "outlier detection",
    "descriptive statistics",
    "mean and median",
    "standard deviation",
    "correlation",
    "regression",
    "data visualization",
    "Power BI",
    "Excel analysis",
    "Python pandas",
    "data validation",
    "business metrics",
  ],

  "Electrical Engineering": [
    "Ohm's law",
    "Kirchhoff's laws",
    "series circuits",
    "parallel circuits",
    "AC and DC",
    "electrical power",
    "electrical energy",
    "transformers",
    "electric motors",
    "generators",
    "three-phase systems",
    "power factor",
    "circuit breakers",
    "protective relays",
    "earthing and grounding",
    "electrical wiring",
    "induction motors",
    "synchronous machines",
    "power transmission",
    "power distribution",
    "switchgear",
    "electrical measurements",
    "semiconductor diodes",
    "transistors",
    "renewable energy systems",
  ],

  "Mechanical Engineering": [
    "thermodynamics",
    "laws of thermodynamics",
    "heat transfer",
    "fluid mechanics",
    "Bernoulli's principle",
    "stress and strain",
    "bending moment",
    "shear force",
    "manufacturing processes",
    "casting",
    "welding",
    "machining",
    "CNC machines",
    "engineering materials",
    "fatigue failure",
    "factor of safety",
    "gears",
    "bearings",
    "internal combustion engines",
    "refrigeration",
    "air conditioning",
    "boilers",
    "pumps",
    "turbines",
    "computer-aided design",
  ],
};

// Three question styles create distinct questions for each topic.
const questionTemplates = {
  Easy: [
    (topic) => `What is ${topic}, and why is it important?`,
    (topic) => `Explain the basic principles of ${topic}.`,
    (topic) => `Can you give a simple example of ${topic}?`,
    (topic) => `What are the main components or features of ${topic}?`,
    (topic) => `Where is ${topic} commonly used?`,
  ],

  Medium: [
    (topic) => `How does ${topic} work in a practical application?`,
    (topic) => `What are the advantages and limitations of ${topic}?`,
    (topic) => `How would you troubleshoot a problem involving ${topic}?`,
    (topic) => `How does ${topic} compare with alternative approaches?`,
    (topic) => `Describe a real-world use case for ${topic}.`,
  ],

  Hard: [
    (topic) => `How would you optimize a system involving ${topic}?`,
    (topic) => `How would you diagnose a complex failure involving ${topic}?`,
    (topic) => `What design trade-offs would you consider when using ${topic}?`,
    (topic) => `How would you evaluate the reliability and performance of ${topic}?`,
    (topic) => `Describe a challenging real-world problem involving ${topic} and how you would solve it.`,
  ],
};

// Generate 25 questions per difficulty for every technical role.
export const interviewQuestions = Object.fromEntries(
  Object.entries(technicalTopics).map(([role, topics]) => [
    role,
    {
      [role]: Object.fromEntries(
        ["Easy", "Medium", "Hard"].map((difficulty) => [
          difficulty,
          topics.map((topic, index) =>
            questionTemplates[difficulty][index % 5](topic)
          ),
        ])
      ),
    },
  ])
);
// ==========================================
// HR INTERVIEW QUESTIONS
// ==========================================

const hrQuestions = {
  "HR Generalist": {
    Easy: [
      "What are the main responsibilities of an HR Generalist?",
      "How would you explain the employee onboarding process?",
      "Why is maintaining employee records important?",
    ],
    Medium: [
      "How would you handle an employee grievance?",
      "How would you manage an employee onboarding program?",
      "How would you support performance reviews?",
    ],
    Hard: [
      "How would you resolve a complex employee relations issue?",
      "How would you improve employee retention using HR data?",
      "How would you ensure HR policies comply with employment laws?",
    ],
  },

  "HR Specialist": {
    Easy: [
      "What area of HR would you specialize in and why?",
      "What is the purpose of employee training?",
      "Why is accurate payroll information important?",
    ],
    Medium: [
      "How would you measure the success of a recruitment campaign?",
      "How would you identify employee training needs?",
      "How would you handle confidential employee information?",
    ],
    Hard: [
      "How would you redesign a recruitment process with poor results?",
      "How would you evaluate the effectiveness of a training program?",
      "How would you manage a sensitive HR investigation fairly?",
    ],
  },

  "HR Business Partner": {
    Easy: [
      "What does an HR Business Partner do?",
      "How can HR support business goals?",
      "Why is communication important in an HR role?",
    ],
    Medium: [
      "How would you align workforce planning with business strategy?",
      "How would you advise a manager dealing with low team morale?",
      "How would you use workforce data to identify HR issues?",
    ],
    Hard: [
      "How would you balance employee needs with business priorities?",
      "How would you advise leadership during organizational restructuring?",
      "How would you build a workforce strategy for a rapidly growing company?",
    ],
  },
};

// ==========================================
// BEHAVIORAL INTERVIEW QUESTIONS
// ==========================================

const behavioralQuestions = {
  "General Behavioral": {
    Easy: [
      "Tell me about yourself.",
      "What are your strengths?",
      "Why do you want this job?",
    ],
    Medium: [
      "Tell me about a challenge you overcame.",
      "Describe a time you received constructive feedback.",
      "Tell me about a mistake and what you learned from it.",
    ],
    Hard: [
      "Describe a difficult decision you made with limited information.",
      "Tell me about a time you had to adapt to a major change.",
      "Describe a situation where you had to influence someone who disagreed with you.",
    ],
  },

  Leadership: {
    Easy: [
      "What does good leadership mean to you?",
      "How do you motivate a team?",
      "What makes a good team leader?",
    ],
    Medium: [
      "Describe a time you helped resolve a team conflict.",
      "How would you motivate a team facing a difficult deadline?",
      "Tell me about a time you took initiative.",
    ],
    Hard: [
      "Describe a time you led a team through significant uncertainty.",
      "How would you address repeated underperformance on your team?",
      "Tell me about a difficult trade-off you made as a leader.",
    ],
  },

  Teamwork: {
    Easy: [
      "Why is teamwork important?",
      "How do you contribute to a team?",
      "How do you communicate with teammates?",
    ],
    Medium: [
      "Tell me about a disagreement with a teammate.",
      "Describe a time you helped a struggling teammate.",
      "How do you handle different working styles?",
    ],
    Hard: [
      "Describe a conflict that threatened a project's success and how you handled it.",
      "How would you work with a team that disagrees on priorities?",
      "Tell me about a time you had to rebuild trust within a team.",
    ],
  },

  "Problem Solving": {
    Easy: [
      "How do you approach a new problem?",
      "What do you do when you get stuck?",
      "How do you decide which task to solve first?",
    ],
    Medium: [
      "Tell me about a complex problem you solved.",
      "How do you make decisions when information is incomplete?",
      "Describe a time you found a more efficient way to work.",
    ],
    Hard: [
      "Describe a high-impact problem with multiple possible solutions and how you chose one.",
      "How would you investigate a recurring problem with no obvious cause?",
      "Tell me about a decision where every available option had a drawback.",
    ],
  },
};

// ==========================================
// SHUFFLE QUESTIONS
// ==========================================

function shuffleQuestions(questions) {
  const shuffled = [...questions];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
}

// ==========================================
// GET INTERVIEW QUESTIONS
// ==========================================

export function getInterviewQuestions(
  interviewType,
  interviewRole,
  difficulty
) {
  // HR interviews: preserve the existing 3-question format.
  if (interviewType === "HR") {
    const questions =
      hrQuestions[interviewRole]?.[difficulty] || [];

    return shuffleQuestions(questions);
  }

  // Behavioral interviews: preserve the existing 3-question format.
  if (interviewType === "Behavioral") {
    const questions =
      behavioralQuestions[interviewRole]?.[difficulty] || [];

    return shuffleQuestions(questions);
  }

  // Technical interviews.
  const questions =
    interviewQuestions[interviewRole]?.[interviewRole]?.[
      difficulty
    ] || [];

  // Randomly select 5 questions from the 25-question pool.
  return shuffleQuestions(questions).slice(0, 5);
}