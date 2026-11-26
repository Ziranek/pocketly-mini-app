
import React, { useState } from "react";

function App() {
  const [tab, setTab] = useState("Home");
  const [message, setMessage] = useState("");
  const [adLoading, setAdLoading] = useState(false);

  const notify = (text) => {
    setMessage(text);
  };

  const watchAdvertisements = async () => {
    if (adLoading) return;

    const showAd = window.show_12353520;

    if (typeof showAd !== "function") {
      notify("The ad service is loading. Please try again shortly.");
      return;
    }

    setAdLoading(true);
    setMessage("Loading advertisement...");

    try {
      const result = await showAd();

      if (result?.reward_event_type === "valued") {
        notify(
          "Valid ad view detected! Your reward is awaiting secure verification."
        );
      } else {
        notify(
          "The ad ended, but a rewarded view was not confirmed. No points added."
        );
      }
    } catch (error) {
      notify("Advertisement unavailable. Please try again later.");
    } finally {
      setAdLoading(false);
    }
  };

  const inviteFriends = async () => {
    const link = "https://t.me/Pocketlyearnbot";

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join Pocketly",
          text: "Join me on Pocketly and explore rewards!",
          url: link
        });
      } else {
        await navigator.clipboard.writeText(link);
        notify("Invite link copied!");
      }
    } catch (error) {
      notify("You can share this link: " + link);
    }
  };

  const renderContent = () => {
    if (tab === "Rewards") {
      return (
        <section className="section">
          <h3>Your rewards</h3>
          <div className="balance">
            <h1>0 <span>PTS</span></h1>
            <small>Your points will appear here.</small>
          </div>
          <button
            className="action-button"
            onClick={() => notify("Daily rewards are coming soon!")}
          >
            Check daily rewards
          </button>
        </section>
      );
    }

    if (tab === "Invite") {
      return (
        <section className="section">
          <h3>Invite friends</h3>
          <p>Share Pocketly with your friends.</p>
          <button className="action-button" onClick={inviteFriends}>
            Invite friends
          </button>
        </section>
      );
    }

    if (tab === "Profile") {
      return (
        <section className="section">
          <h3>Your profile</h3>
          <p>Welcome to Pocketly!</p>
          <p>Account status: New member</p>
          <p>Points: 0</p>
        </section>
      );
    }

    return (
      <>
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

          <button
            className="activity"
            onClick={watchAdvertisements}
            disabled={adLoading}
          >
            <div className="activity-icon">▶️</div>
            <div className="activity-info">
              <strong>
                {adLoading ? "Loading advertisement..." : "Watch advertisements"}
              </strong>
              <small>Watch ads and earn points.</small>
            </div>
            <span>→</span>
          </button>

          <button
            className="activity"
            onClick={() => {
              setTab("Rewards");
              notify("Welcome to your rewards page!");
            }}
          >
            <div className="activity-icon">🎁</div>
            <div className="activity-info">
              <strong>Daily rewards</strong>
              <small>Explore your reward activities.</small>
            </div>
            <span>→</span>
          </button>

          <button className="activity" onClick={inviteFriends}>
            <div className="activity-icon">👥</div>
            <div className="activity-info">
              <strong>Invite friends</strong>
              <small>Share Pocketly with your friends.</small>
            </div>
            <span>→</span>
          </button>
        </section>
      </>
    );
  };

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
        {renderContent()}

        {message && (
          <div className="notice">
            <p>{message}</p>
            <button onClick={() => setMessage("")}>Dismiss</button>
          </div>
        )}
      </main>

      <footer>
        {["Home", "Rewards", "Invite", "Profile"].map((item, index) => (
          <button
            key={item}
            onClick={() => {
              setTab(item);
              setMessage("");
            }}
            style={{
              color: tab === item ? "#16a36a" : "inherit",
              fontWeight: tab === item ? "bold" : "normal",
              cursor: "pointer",
              border: "none",
              background: "transparent"
            }}
          >
            <span>{["⌂", "🎁", "👥", "👤"][index]}</span>
            <small>{item}</small>
          </button>
        ))}
      </footer>
    </div>
  );
}

export default App;
