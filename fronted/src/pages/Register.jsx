import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const handleRegister = (e) => {
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
          <div className="auth-badge">✦ START YOUR JOURNEY</div>

          <h1>
            Build confidence.
            <br />
            <span>Get interview ready.</span>
          </h1>

          <p>
            Create your account and start practicing technical interviews
            with intelligent feedback.
          </p>

          <div className="auth-features">
            <div>
              <span>✓</span>
              Personalized interview sessions
            </div>

            <div>
              <span>✓</span>
              Track your progress
            </div>

            <div>
              <span>✓</span>
              Identify technical gaps
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
            <h2>Create your account</h2>
            <p>Start your personalized interview preparation.</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Full name</label>
              <input
                type="text"
                placeholder="Alex Johnson"
                required
              />
            </div>

            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                required
              />
            </div>

            <label className="checkbox-row">
              <input type="checkbox" required />
              <span>I agree to the terms and conditions</span>
            </label>

            <button className="primary-button full-button" type="submit">
              Create Account
              <span>→</span>
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;