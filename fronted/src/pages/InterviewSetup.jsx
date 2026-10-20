import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

function InterviewSetup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("Frontend Developer");
  const [technology, setTechnology] = useState("React.js");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questions, setQuestions] = useState("10");

    const startInterview = () => {
      navigate("/interview", {
        state: {
          role,
          technology,
          difficulty,
          questionCount: Number(questions),
        },
      });
    };
  return (
    <Layout>
      <header className="top-header">
        <div>
          <span className="page-label">INTERVIEW</span>
          <h1>Setup your interview</h1>
          <p>Customize the interview according to your preparation goals.</p>
        </div>
      </header>

      <div className="setup-wrapper">
        <div className="setup-main">
          <div className="content-card setup-card">
            <div className="setup-heading">
              <div className="setup-number">01</div>
              <div>
                <h3>Choose your interview</h3>
                <p>
                  Select the role and technology you want to practice.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Target Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option>Frontend Developer</option>
                  <option>Backend Developer</option>
                  <option>Full Stack Developer</option>
                  <option>Software Engineer</option>
                  <option>Data Analyst</option>
                </select>
              </div>

              <div className="form-group">
                <label>Technology</label>
                <select
                  value={technology}
                  onChange={(e) => setTechnology(e.target.value)}
                >
                  <option>React.js</option>
                  <option>JavaScript</option>
                  <option>Node.js</option>
                  <option>Python</option>
                  <option>Java</option>
                  <option>SQL</option>
                </select>
              </div>
            </div>
          </div>

          <div className="content-card setup-card">
            <div className="setup-heading">
              <div className="setup-number">02</div>
              <div>
                <h3>Select difficulty</h3>
                <p>Choose the level that matches your current preparation.</p>
              </div>
            </div>

            <div className="difficulty-options">
              {["Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  className={`difficulty-card ${
                    difficulty === level ? "selected" : ""
                  }`}
                  onClick={() => setDifficulty(level)}
                >
                  <div className="difficulty-icon">
                    {level === "Easy"
                      ? "●"
                      : level === "Medium"
                      ? "◆"
                      : "★"}
                  </div>

                  <strong>{level}</strong>

                  <span>
                    {level === "Easy"
                      ? "Fundamental concepts"
                      : level === "Medium"
                      ? "Practical knowledge"
                      : "Advanced concepts"}
                  </span>

                  {difficulty === level && (
                    <div className="selected-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="content-card setup-card">
            <div className="setup-heading">
              <div className="setup-number">03</div>
              <div>
                <h3>Interview length</h3>
                <p>Choose how many questions you want to answer.</p>
              </div>
            </div>

            <div className="question-options">
              {["5", "10", "15"].map((number) => (
                <button
                  key={number}
                  className={`question-option ${
                    questions === number ? "selected" : ""
                  }`}
                  onClick={() => setQuestions(number)}
                >
                  {number}
                  <span>Questions</span>
                </button>
              ))}
            </div>
          </div>

          <button
            className="primary-button start-button"
            onClick={startInterview}
          >
            Start Interview
            <span>→</span>
          </button>
        </div>

        <aside className="interview-preview">
          <div className="preview-card">
            <span className="section-label">INTERVIEW PREVIEW</span>

            <div className="preview-icon">🎙</div>

            <h3>{role}</h3>
            <p>{technology} Technical Interview</p>

            <div className="preview-details">
              <div>
                <span>Difficulty</span>
                <strong>{difficulty}</strong>
              </div>

              <div>
                <span>Questions</span>
                <strong>{questions}</strong>
              </div>

              <div>
                <span>Estimated time</span>
                <strong>{Number(questions) * 2}–{Number(questions) * 3} min</strong>
              </div>
            </div>

            <div className="ai-note">
              <span>✦</span>
              <p>
                AI will evaluate your technical answers, grammar,
                communication and speaking style.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}

export default InterviewSetup;