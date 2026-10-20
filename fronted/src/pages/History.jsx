import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

function History() {
  const navigate = useNavigate();

  const interviews = [
    {
      title: "React.js Developer",
      type: "Technical Interview",
      date: "Today, 10:30 AM",
      score: "84%",
      difficulty: "Medium",
      icon: "R",
    },
    {
      title: "JavaScript Fundamentals",
      type: "Technical Interview",
      date: "Yesterday, 4:15 PM",
      score: "76%",
      difficulty: "Medium",
      icon: "JS",
    },
    {
      title: "Node.js Backend",
      type: "Technical Interview",
      date: "Sep 14, 2026",
      score: "72%",
      difficulty: "Hard",
      icon: "N",
    },
    {
      title: "Frontend System Design",
      type: "Technical Interview",
      date: "Sep 10, 2026",
      score: "81%",
      difficulty: "Hard",
      icon: "F",
    },
    {
      title: "React Basics",
      type: "Technical Interview",
      date: "Sep 07, 2026",
      score: "69%",
      difficulty: "Easy",
      icon: "R",
    },
  ];

  return (
    <Layout>
      <header className="top-header">
        <div>
          <span className="page-label">ACTIVITY</span>
          <h1>Interview History</h1>
          <p>Track your previous interview attempts and progress.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/interview/setup")}
        >
          New Interview
          <span>→</span>
        </button>
      </header>

      <div className="history-summary">
        <div className="summary-card">
          <span>Total Interviews</span>
          <strong>12</strong>
        </div>

        <div className="summary-card">
          <span>Average Score</span>
          <strong>78%</strong>
        </div>

        <div className="summary-card">
          <span>Highest Score</span>
          <strong>91%</strong>
        </div>

        <div className="summary-card">
          <span>Total Practice</span>
          <strong>4h 32m</strong>
        </div>
      </div>

      <div className="content-card history-card">
        <div className="card-header">
          <div>
            <span className="section-label">ALL INTERVIEWS</span>
            <h3>Practice sessions</h3>
          </div>

          <select className="filter-select">
            <option>All interviews</option>
            <option>React.js</option>
            <option>JavaScript</option>
            <option>Node.js</option>
          </select>
        </div>

        <div className="history-table">
          <div className="history-table-header">
            <span>INTERVIEW</span>
            <span>DATE</span>
            <span>DIFFICULTY</span>
            <span>SCORE</span>
            <span></span>
          </div>

          {interviews.map((interview, index) => (
            <div className="history-table-row" key={index}>
              <div className="history-title">
                <div className="tech-icon">{interview.icon}</div>

                <div>
                  <strong>{interview.title}</strong>
                  <span>{interview.type}</span>
                </div>
              </div>

              <span>{interview.date}</span>

              <span className="difficulty-badge">
                {interview.difficulty}
              </span>

              <strong className="history-score">
                {interview.score}
              </strong>

              <button
                className="small-button"
                onClick={() => navigate("/results")}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default History;