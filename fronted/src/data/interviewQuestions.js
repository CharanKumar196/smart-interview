export const interviewQuestions = {
  "Frontend Developer": {
    "React.js": {
      Easy: [
        "What is React, and why is it used?",
        "What is JSX?",
        "What are React components?",
        "What is the Virtual DOM?",
        "What are props in React?",
      ],
      Medium: [
        "Explain the difference between state and props.",
        "What are React Hooks?",
        "What is the useEffect Hook used for?",
        "How does conditional rendering work in React?",
        "How do you handle events in React?",
      ],
      Hard: [
        "How would you optimize a slow React application?",
        "Explain React reconciliation and its purpose.",
        "How would you manage shared state across components?",
        "What causes unnecessary re-renders in React?",
        "How would you design reusable React components?",
      ],
    },
    JavaScript: {
      Easy: [
        "What is JavaScript?",
        "What is the difference between let, const, and var?",
        "What are JavaScript data types?",
        "What is a function?",
        "What is an array in JavaScript?",
      ],
      Medium: [
        "Explain closures in JavaScript.",
        "What is the difference between == and ===?",
        "How do Promises work?",
        "Explain async and await.",
        "What is event bubbling?",
      ],
      Hard: [
        "Explain the JavaScript event loop.",
        "What is the difference between microtasks and macrotasks?",
        "How does prototypal inheritance work?",
        "How would you prevent memory leaks in a web application?",
        "Explain debouncing and throttling with use cases.",
      ],
    },
  },

  "Backend Developer": {
    "Node.js": {
      Easy: [
        "What is Node.js?",
        "What is npm?",
        "What is an API?",
        "What is Express.js?",
        "What is JSON?",
      ],
      Medium: [
        "Explain middleware in Express.js.",
        "What is the difference between authentication and authorization?",
        "How does Node.js handle asynchronous operations?",
        "What are HTTP status codes?",
        "How do you validate API request data?",
      ],
      Hard: [
        "How would you design a scalable REST API?",
        "How would you secure an API against common attacks?",
        "How would you handle errors in an asynchronous Node.js application?",
        "How would you implement rate limiting?",
        "How would you improve API performance under heavy load?",
      ],
    },
  },

  "Full Stack Developer": {
    JavaScript: {
      Easy: [
        "What is the difference between frontend and backend?",
        "What is HTTP?",
        "What is an API?",
        "What is the purpose of a database?",
        "What is responsive web design?",
      ],
      Medium: [
        "Explain how a frontend communicates with a backend.",
        "What is CRUD?",
        "How does JWT-based authentication work?",
        "What is the difference between SQL and NoSQL?",
        "How do you handle API errors in a frontend application?",
      ],
      Hard: [
        "How would you design a full-stack application for many users?",
        "How would you implement secure user authentication?",
        "How would you troubleshoot a slow database-backed application?",
        "How would you deploy and monitor a full-stack application?",
        "How would you design reliable file uploads?",
      ],
    },
  },

  "Cloud Computing": {
    AWS: {
      Easy: [
        "What is cloud computing?",
        "What is AWS?",
        "What is Amazon EC2?",
        "What is Amazon S3?",
        "What is the difference between a Region and an Availability Zone?",
      ],
      Medium: [
        "What is IAM, and why is it important?",
        "Explain load balancing in AWS.",
        "What is Auto Scaling?",
        "What is Amazon RDS?",
        "How would you secure files stored in Amazon S3?",
      ],
      Hard: [
        "How would you design a highly available web application on AWS?",
        "How would you reduce cloud infrastructure costs?",
        "How would you design disaster recovery for a critical application?",
        "How would you monitor and troubleshoot an AWS application?",
        "How would you design least-privilege access for cloud resources?",
      ],
    },
    Azure: {
      Easy: [
        "What is Microsoft Azure?",
        "What is an Azure Virtual Machine?",
        "What is Azure Blob Storage?",
        "What is Microsoft Entra ID?",
        "What is an Azure Region?",
      ],
      Medium: [
        "What is Azure Virtual Network?",
        "Explain Azure App Service.",
        "What is Azure Monitor?",
        "How does Azure role-based access control work?",
        "What is the purpose of Azure SQL Database?",
      ],
      Hard: [
        "How would you design a highly available Azure application?",
        "How would you secure resources across multiple Azure subscriptions?",
        "How would you plan disaster recovery in Azure?",
        "How would you optimize Azure infrastructure costs?",
        "How would you monitor a distributed application in Azure?",
      ],
    },
  },

  "Software Tester": {
    "Manual Testing": {
      Easy: [
        "What is software testing?",
        "What is the difference between verification and validation?",
        "What is a test case?",
        "What is a bug?",
        "What is the difference between severity and priority?",
      ],
      Medium: [
        "Explain regression testing.",
        "What is the difference between smoke and sanity testing?",
        "How do you write effective test cases?",
        "Explain the software testing life cycle.",
        "What is boundary value analysis?",
      ],
      Hard: [
        "How would you design a test strategy for a complex application?",
        "How would you prioritize testing with limited time?",
        "How would you investigate an intermittent defect?",
        "How would you approach risk-based testing?",
        "How would you test a system with many integrations?",
      ],
    },
    "Automation Testing": {
      Easy: [
        "What is automation testing?",
        "What is Selenium?",
        "What is a test script?",
        "What is a locator in Selenium?",
        "What is the purpose of assertions in testing?",
      ],
      Medium: [
        "What is the Page Object Model?",
        "How do you handle dynamic web elements?",
        "How do you manage waits in Selenium?",
        "How would you run tests in a CI pipeline?",
        "What is data-driven testing?",
      ],
      Hard: [
        "How would you design a maintainable automation framework?",
        "How would you reduce flaky automated tests?",
        "How would you parallelize test execution safely?",
        "How would you manage test data across environments?",
        "How would you decide which tests to automate?",
      ],
    },
  },

  "Data Analyst": {
    SQL: {
      Easy: [
        "What is SQL?",
        "What is a primary key?",
        "What is a foreign key?",
        "What is the purpose of the WHERE clause?",
        "What is the difference between DELETE and DROP?",
      ],
      Medium: [
        "Explain INNER JOIN and LEFT JOIN.",
        "What is GROUP BY used for?",
        "What is the difference between WHERE and HAVING?",
        "How would you identify duplicate records?",
        "What are aggregate functions in SQL?",
      ],
      Hard: [
        "How would you optimize a slow SQL query?",
        "Explain window functions with an example use case.",
        "How would you analyze monthly customer retention?",
        "How would you investigate inconsistent business metrics?",
        "How would you design a query for a large analytical dataset?",
      ],
    },
    Python: {
      Easy: [
        "What is Python?",
        "What are lists and tuples?",
        "What is a dictionary in Python?",
        "What is a Python function?",
        "What is the purpose of a for loop?",
      ],
      Medium: [
        "How do you handle missing data using pandas?",
        "What is the difference between a list and a set?",
        "How do you merge two pandas DataFrames?",
        "How do you identify duplicate records?",
        "How would you summarize a dataset?",
      ],
      Hard: [
        "How would you process a dataset too large for memory?",
        "How would you detect outliers in business data?",
        "How would you validate a data transformation pipeline?",
        "How would you investigate unexpected changes in a metric?",
        "How would you improve the performance of a pandas workflow?",
      ],
    },
  },
};

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

export function getInterviewQuestions(
  interviewType,
  interviewRole,
  difficulty
) {
  if (interviewType === "HR") {
    return hrQuestions[interviewRole]?.[difficulty] || [];
  }

  if (interviewType === "Behavioral") {
    return behavioralQuestions[interviewRole]?.[difficulty] || [];
  }

  const roleMapping = {
    "Frontend Developer": ["Frontend Developer", "React.js"],
    "Backend Developer": ["Backend Developer", "Node.js"],
    "Full Stack Developer": ["Full Stack Developer", "JavaScript"],
    "Cloud Computing": ["Cloud Computing", "AWS"],
    "Software Tester": ["Software Tester", "Manual Testing"],
    "Data Analyst": ["Data Analyst", "SQL"],
  };

  const [role, technology] = roleMapping[interviewRole] || [];

  if (!role) {
    return [];
  }

  return interviewQuestions[role]?.[technology]?.[difficulty] || [];
}