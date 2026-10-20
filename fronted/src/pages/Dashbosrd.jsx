import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <Layout>
      <header className="top-header">
        <div>
          <span className="page-label">DASHBOARD</span>
          <h1>Good morning, Alex 👋</h1>
          <p>Ready to sharpen your interview skills today?</p>
        </div>

        <div className="header-profile">
          <div className="notification">♧</div>
          <div className="avatar">AJ</div>
          <div className="header-user">
            <strong>Alex Johnson</strong>
            <span>Frontend Developer</span>
          </div>
        </div>
      </header>

      <section className="hero-card">
        <div className="hero-text">
          <span className="hero-tag">AI MOCK INTERVIEW</span>

          <h2>Practice like it's the real thing.</h2>

          <p>
            Simulate realistic technical interviews and get instant
            AI-powered feedback on your performance.
          </p>

          <button
            className="primary-button"
            onClick={() => navigate("/interview/setup")}
          >
            Start New Interview
            <span>→</span>
          </button>
        </div>

        <div className="hero-visual">
          <div className="hero-circle">
            <div className="hero-mic">🎙</div>
          </div>
          <div className="floating-card card-one">
            <span>Technical</span>
            <strong>86%</strong>
          </div>
          <div className="floating-card card-two">
            <span>Confidence</span>
            <strong>78%</strong>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">▣</div>
          <div>
            <span>Total Interviews</span>
            <strong>12</strong>
          </div>
          <small className="positive">+3 this month</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">★</div>
          <div>
            <span>Average Score</span>
            <strong>78%</strong>
          </div>
          <small className="positive">+6% improvement</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">◷</div>
          <div>
            <span>Practice Time</span>
            <strong>4h 32m</strong>
          </div>
          <small>This month</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">♛</div>
          <div>
            <span>Best Score</span>
            <strong>91%</strong>
          </div>
          <small>Personal best</small>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="content-card">
          <div className="card-header">
            <div>
              <span className="section-label">RECENT ACTIVITY</span>
              <h3>Recent Interviews</h3>
            </div>

            <button
              className="text-button"
              onClick={() => navigate("/history")}
            >
              View all →
            </button>
          </div>

          <div className="interview-list">
            <div className="interview-row">
              <div className="tech-icon react-icon">R</div>

              <div className="interview-info">
                <strong>React.js Developer</strong>
                <span>Technical Interview • Today</span>
              </div>

              <div className="score green-score">84%</div>
              <button
                className="small-button"
                onClick={() => navigate("/results")}
              >
                Report
              </button>
            </div>

            <div className="interview-row">
              <div className="tech-icon js-icon">JS</div>

              <div className="interview-info">
                <strong>JavaScript Fundamentals</strong>
                <span>Technical Interview • Yesterday</span>
              </div>

              <div className="score blue-score">76%</div>
              <button
                className="small-button"
                onClick={() => navigate("/results")}
              >
                Report
              </button>
            </div>

            <div className="interview-row">
              <div className="tech-icon node-icon">N</div>

              <div className="interview-info">
                <strong>Node.js Backend</strong>
                <span>Technical Interview • Sep 14</span>
              </div>

              <div className="score orange-score">72%</div>
              <button
                className="small-button"
                onClick={() => navigate("/results")}
              >
                Report
              </button>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <span className="section-label">RECOMMENDED</span>
              <h3>Practice Topics</h3>
            </div>
          </div>

          <div className="topic-list">
            <div className="topic-item">
              <div>
                <strong>React.js Advanced</strong>
                <span>15 questions • Hard</span>
              </div>
              <button
                onClick={() => navigate("/interview/setup")}
              >
                →
              </button>
            </div>

            <div className="topic-item">
              <div>
                <strong>JavaScript Concepts</strong>
                <span>12 questions • Medium</span>
              </div>
              <button
                onClick={() => navigate("/interview/setup")}
              >
                →
              </button>
            </div>

            <div className="topic-item">
              <div>
                <strong>System Design</strong>
                <span>10 questions • Hard</span>
              </div>
              <button
                onClick={() => navigate("/interview/setup")}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default Dashboard;