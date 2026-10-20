import { useState } from "react";
import Layout from "../components/Layout";

function Profile() {
  const [name, setName] = useState("Alex Johnson");
  const [email, setEmail] = useState("alex@example.com");
  const [role, setRole] = useState("Frontend Developer");

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <Layout>
      <header className="top-header">
        <div>
          <span className="page-label">ACCOUNT</span>
          <h1>Profile & Settings</h1>
          <p>Manage your personal information and preferences.</p>
        </div>
      </header>

      <div className="profile-layout">
        <div className="content-card profile-card">
          <div className="profile-header">
            <div className="large-avatar">AJ</div>

            <div>
              <h2>{name}</h2>
              <p>{role}</p>
              <button className="change-photo">Change photo</button>
            </div>
          </div>

          <div className="profile-divider"></div>

          <h3>Personal Information</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

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
              </select>
            </div>

            <div className="form-group">
              <label>Preferred Technology</label>
              <select>
                <option>React.js</option>
                <option>JavaScript</option>
                <option>Node.js</option>
                <option>Python</option>
                <option>Java</option>
              </select>
            </div>
          </div>

          <button className="primary-button" onClick={handleSave}>
            {saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>

        <div className="content-card settings-card">
          <span className="section-label">PREFERENCES</span>
          <h3>Interview Settings</h3>

          <div className="setting-row">
            <div>
              <strong>Camera access</strong>
              <span>Enable camera during interviews</span>
            </div>

            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span></span>
            </label>
          </div>

          <div className="setting-row">
            <div>
              <strong>Microphone access</strong>
              <span>Enable microphone during interviews</span>
            </div>

            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span></span>
            </label>
          </div>

          <div className="setting-row">
            <div>
              <strong>AI Feedback</strong>
              <span>Show detailed feedback after interviews</span>
            </div>

            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span></span>
            </label>
          </div>

          <div className="setting-row">
            <div>
              <strong>Email notifications</strong>
              <span>Receive practice reminders</span>
            </div>

            <label className="toggle">
              <input type="checkbox" />
              <span></span>
            </label>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Profile;