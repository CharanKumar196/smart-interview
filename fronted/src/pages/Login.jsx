import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="brand-logo">AI</div>
          <span>InterviewAI</span>
        </div>

        <div className="auth-content">
          <div className="auth-badge">✦ AI-POWERED INTERVIEW PRACTICE</div>

          <h1>
            Practice smarter.
            <br />
            <span>Interview better.</span>
          </h1>

          <p>
            Prepare for your next technical interview with AI-powered
            feedback on your answers, communication and confidence.
          </p>

          <div className="auth-features">
            <div>
              <span>✓</span>
              Real-time interview practice
            </div>

            <div>
              <span>✓</span>
              AI-powered answer evaluation
            </div>

            <div>
              <span>✓</span>
              Detailed performance analytics
            </div>
          </div>
        </div>

        <div className="auth-footer">
          © 2026 InterviewAI. Practice with confidence.
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="mobile-brand">
            <div className="brand-logo">AI</div>
            <span>InterviewAI</span>
          </div>

          <div className="form-heading">
            <h2>Welcome back</h2>
            <p>Sign in to continue your interview practice.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label>Password</label>
                <a href="#forgot">Forgot password?</a>
              </div>

              <input
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>

            <label className="checkbox-row">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>

            <button className="primary-button full-button" type="submit">
              Sign In
              <span>→</span>
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <p className="auth-switch">
            Don't have an account?{" "}
            <button onClick={() => navigate("/register")}>
              Create account
            </button>
          </p>

          <div className="demo-note">
            <strong>Demo Mode</strong>
            <span>
              Use any valid email and password to explore the frontend.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;