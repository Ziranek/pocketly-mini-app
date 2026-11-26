
import React, { useState, useEffect } from "react";

function App() {
  const [tab, setTab] = useState("Home");
  const [message, setMessage] = useState("");
  const [adLoading, setAdLoading] = useState(false);
  const [telegramUser, setTelegramUser] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();

      try {
        tg.setHeaderColor("#ffffff");
        tg.setBackgroundColor("#f4f7f5");
      } catch (error) {
        // Some Telegram versions may not support these settings.
      }

      setTelegramUser(tg.initDataUnsafe?.user || null);
    }
  }, []);

  const notify = (text) => {
    setMessage(text);
  };

  const watchAdvertisements = async () => {
    if (adLoading) return;

    const showAd = window.show_12353520;

    if (typeof showAd !== "function") {
      notify("The advertisement service is unavailable. Please try again.");
      return;
    }

    setAdLoading(true);
    setMessage("Preparing your advertisement...");

    try {
      const result = await showAd();

      if (result?.reward_event_type === "valued") {
        notify(
          "Rewarded ad event detected! Your reward is awaiting secure verification."
        );
      } else {
        notify(
          "A rewarded ad was not confirmed. No points have been added."
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
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(
          "https://t.me/share/url?url=" +
          encodeURIComponent(link) +
          "&text=" +
          encodeURIComponent("Join me on Pocketly and explore rewards!")
        );
      } else if (navigator.share) {
        await navigator.share({
          title: "Join Pocketly",
          text: "Join me on Pocketly and explore rewards!",
          url: link
        });
      } else {
        await navigator.clipboard.writeText(link);
        notify("Your Pocketly invite link has been copied!");
      }
    } catch (error) {
      notify("Share Pocketly using this link: " + link);
    }
  };

  const firstName = telegramUser?.first_name;

  const renderContent = () => {
    if (tab === "Rewards") {
      return (
        <section className="section">
          <h3>Your rewards</h3>

          <div className="balance">
            <p>AVAILABLE POINTS</p>
            <h1>0 <span>PTS</span></h1>
            <small>Your verified rewards will appear here.</small>
          </div>

          <button
            className="action-button"
            onClick={() => notify("Daily rewards are coming soon!")}
          >
            Explore daily rewards
          </button>
        </section>
      );
    }

    if (tab === "Invite") {
      return (
        <section className="section">
          <h3>Grow your network</h3>
          <p>Invite friends to discover Pocketly with you.</p>

          <div className="balance">
            <p>YOUR INVITE LINK</p>
            <h1 style={{ fontSize: "25px" }}>Pocketly</h1>
            <small>Share Pocketly with your friends.</small>
          </div>

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

          <div className="balance">
            <p>POCKETLY MEMBER</p>
            <h1 style={{ fontSize: "27px" }}>
              {firstName || "Welcome"}
            </h1>
            <small>
              {telegramUser?.username
                ? "@" + telegramUser.username
                : "Your Pocketly profile"}
            </small>
          </div>

          <div className="activity">
            <div className="activity-icon">👤</div>
            <div className="activity-info">
              <strong>Account status</strong>
              <small>New member</small>
            </div>
          </div>

          <div className="activity">
            <div className="activity-icon">🎁</div>
            <div className="activity-info">
              <strong>Points balance</strong>
              <small>0 PTS</small>
            </div>
          </div>

          <p style={{ marginTop: "18px" }}>
            Your Pocketly account information.
          </p>
        </section>
      );
    }

    return (
      <>
        <section className="welcome">
          <p>
            {firstName
              ? `WELCOME, ${firstName.toUpperCase()}`
              : "WELCOME TO POCKETLY"}
          </p>

          <h1>
            Your rewards.<br />
            Your possibilities.
          </h1>

          <p>
            Discover activities, explore opportunities and enjoy your Pocketly experience.
          </p>
        </section>

        <section className="balance">
          <p>YOUR POINT BALANCE</p>
          <h1>0 <span>PTS</span></h1>
          <small>Your verified rewards will appear here.</small>
        </section>

        <section className="section">
          <h3>Explore activities</h3>

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
              <small>View available rewarded advertisements.</small>
            </div>
            <span>→</span>
          </button>

          <button
            className="activity"
            onClick={() => setTab("Rewards")}
          >
            <div className="activity-icon">🎁</div>
            <div className="activity-info">
              <strong>My rewards</strong>
              <small>Explore your rewards and points.</small>
            </div>
            <span>→</span>
          </button>

          <button
            className="activity"
            onClick={inviteFriends}
          >
            <div className="activity-icon">👥</div>
            <div className="activity-info">
              <strong>Invite friends</strong>
              <small>Share Pocketly with your network.</small>
            </div>
            <span>→</span>
          </button>
        </section>
      </>
    );
  };

  const navigation = [
    { name: "Home", icon: "⌂" },
    { name: "Rewards", icon: "🎁" },
    { name: "Invite", icon: "♧" },
    { name: "Profile", icon: "👤" }
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">P</div>

        <div>
          <h2>Pocketly</h2>
          <small>Your rewards, your way.</small>
        </div>

        <button
          className="avatar"
          onClick={() => setTab("Profile")}
          aria-label="Open profile"
        >
          {telegramUser?.photo_url
            ? <img
                src={telegramUser.photo_url}
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%"
                }}
              />
            : "👤"}
        </button>
      </header>

      <main>
        {renderContent()}

        {message && (
          <div className="notice">
            <p>{message}</p>
            <button onClick={() => setMessage("")}>
              Dismiss
            </button>
          </div>
        )}
      </main>

      <footer>
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              setTab(item.name);
              setMessage("");
            }}
            style={{
              color: tab === item.name ? "#087b50" : "#87958c",
              fontWeight: tab === item.name ? "bold" : "normal",
              cursor: "pointer",
              border: "none",
              background: "transparent"
            }}
          >
            <span>{item.icon}</span>
            <small>{item.name}</small>
          </button>
        ))}
      </footer>
    </div>
  );
}

export default App;
