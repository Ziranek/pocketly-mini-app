
import React from "react";

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">P</div>
        <div>
          <h2>Pocketly</h2>
          <small>Your rewards, your way.</small>
        </div>
        <div className="avatar">👤</div>
      </header>

      <main>
        <section className="welcome">
          <p>WELCOME TO POCKETLY</p>
          <h1>Earn rewards<br />as you explore.</h1>
          <p>Complete activities and collect points.</p>
        </section>

        <section className="balance">
          <p>YOUR POINT BALANCE</p>
          <h1>0 <span>PTS</span></h1>
          <small>Your rewards will appear here.</small>
        </section>

        <section className="section">
          <h3>Daily activities</h3>
          <div className="activity">
            <div className="activity-icon">▶️</div>
            <div className="activity-info">
              <strong>Watch advertisements</strong>
              <small>Discover available rewarded ads.</small>
            </div>
            <span>→</span>
          </div>

          <div className="activity">
            <div className="activity-icon">🎁</div>
            <div className="activity-info">
              <strong>Daily rewards</strong>
              <small>Check back for daily activities.</small>
            </div>
            <span>→</span>
          </div>

          <div className="activity">
            <div className="activity-icon">👥</div>
            <div className="activity-info">
              <strong>Invite friends</strong>
              <small>Share Pocketly with your friends.</small>
            </div>
            <span>→</span>
          </div>
        </section>

        <section className="notice">
          <strong>Welcome to Pocketly!</strong>
          <p>Our rewards and advertising features are being prepared. Stay tuned.</p>
        </section>
      </main>

      <footer>
        <span>⌂<small>Home</small></span>
        <span>🎁<small>Rewards</small></span>
        <span>👥<small>Invite</small></span>
        <span>👤<small>Profile</small></span>
      </footer>
    </div>
  );
}

export default App;
