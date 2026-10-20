import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

function Results() {
  const navigate = useNavigate();

  return (
    <Layout>
      <header className="top-header">
        <div>
          <span className="page-label">AI ANALYSIS</span>
          <h1>Interview Performance</h1>
          <p>Your detailed AI-powered interview feedback.</p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/interview/setup")}
        >
          Practice Again
        </button>
      </header>

      <section className="results-overview">
        <div className="overall-score-card">
          <span>OVERALL SCORE</span>

          <div className="score-circle">
            <strong>82</strong>
            <small>/100</small>
          </div>

          <h3>Good Performance</h3>
          <p>
            You demonstrated solid technical knowledge with room
            for improvement in communication.
          </p>
        </div>

        <div className="score-breakdown">
          <div className="content-card">
            <div className="score-item">
              <div className="score-item-header">
                <span>Technical Knowledge</span>
                <strong>86%</strong>
              </div>
              <div className="progress-bar">
                <div style={{ width: "86%" }}></div>
              </div>
            </div>

            <div className="score-item">
              <div className="score-item-header">
                <span>Communication</span>
                <strong>78%</strong>
              </div>
              <div className="progress-bar">
                <div style={{ width: "78%" }}></div>
              </div>
            </div>

            <div className="score-item">
              <div className="score-item-header">
                <span>Grammar</span>
                <strong>84%</strong>
              </div>
              <div className="progress-bar">
                <div style={{ width: "84%" }}></div>
              </div>
            </div>

            <div className="score-item">
              <div className="score-item-header">
                <span>Confidence</span>
                <strong>76%</strong>
              </div>
              <div className="progress-bar">
                <div style={{ width: "76%" }}></div>
              </div>
            </div>

            <div className="score-item">
              <div className="score-item-header">
                <span>Answer Relevance</span>
                <strong>88%</strong>
              </div>
              <div className="progress-bar">
                <div style={{ width: "88%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="results-grid">
        <div className="content-card">
          <div className="card-header">
            <div>
              <span className="section-label">SPEECH ANALYSIS</span>
              <h3>Communication insights</h3>
            </div>
          </div>

          <div className="speech-metrics">
            <div className="speech-metric">
              <div className="metric-icon">◷</div>
              <span>Speaking Pace</span>
              <strong>138 WPM</strong>
              <small>Good pace</small>
            </div>

            <div className="speech-metric">
              <div className="metric-icon">〰</div>
              <span>Filler Words</span>
              <strong>7</strong>
              <small>Across 8 minutes</small>
            </div>

            <div className="speech-metric">
              <div className="metric-icon">◉</div>
              <span>Clarity</span>
              <strong>82%</strong>
              <small>Clear speech</small>
            </div>

            <div className="speech-metric">
              <div className="metric-icon">♧</div>
              <span>Confidence</span>
              <strong>76%</strong>
              <small>Can improve</small>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <span className="section-label">TECHNICAL ANALYSIS</span>
              <h3>Knowledge coverage</h3>
            </div>
          </div>

          <div className="keyword-list">
            <div className="keyword-row success">
              <span>✓</span>
              Virtual DOM
            </div>

            <div className="keyword-row success">
              <span>✓</span>
              React Components
            </div>

            <div className="keyword-row success">
              <span>✓</span>
              Reconciliation
            </div>

            <div className="keyword-row success">
              <span>✓</span>
              Rendering
            </div>

            <div className="keyword-row missing">
              <span>×</span>
              Diffing Algorithm
            </div>

            <div className="keyword-row missing">
              <span>×</span>
              Performance Optimization
            </div>
          </div>
        </div>
      </section>

      <section className="content-card suggestions-card">
        <div className="card-header">
          <div>
            <span className="section-label">AI RECOMMENDATIONS</span>
            <h3>How you can improve</h3>
          </div>
        </div>

        <div className="suggestions-grid">
          <div className="suggestion">
            <div>01</div>
            <div>
              <strong>Reduce filler words</strong>
              <p>
                Try taking a short pause instead of using words such
                as "um", "like" and "actually".
              </p>
            </div>
          </div>

          <div className="suggestion">
            <div>02</div>
            <div>
              <strong>Explain concepts with examples</strong>
              <p>
                Include practical examples when explaining technical
                concepts.
              </p>
            </div>
          </div>

          <div className="suggestion">
            <div>03</div>
            <div>
              <strong>Strengthen technical depth</strong>
              <p>
                Review performance optimization and React's
                reconciliation process.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default Results;