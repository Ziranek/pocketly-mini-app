
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
        console.log("Telegram display settings unavailable.");
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

  const fullName = telegramUser
    ? [telegramUser.first_name, telegramUser.last_name]
        .filter(Boolean)
        .join(" ")
    : "";

  const profileName = fullName || "Pocketly Member";

  const profilePhoto = telegramUser?.photo_url;
  const username = telegramUser?.username;
  const telegramId = telegramUser?.id;
  const language = telegramUser?.language_code;

  const ProfileRow = ({ icon, label, value }) => (
    <div className="activity">
      <div className="activity-icon">{icon}</div>
      <div className="activity-info">
        <small>{label}</small>
        <strong>{value || "Not available"}</strong>
      </div>
    </div>
  );

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
          <h3>My profile</h3>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e9efeb",
              borderRadius: "22px",
              padding: "25px 18px",
              textAlign: "center",
              marginBottom: "22px",
              boxShadow: "0 4px 14px rgba(24,54,37,.035)"
            }}
          >
            <div
              style={{
                width: "88px",
                height: "88px",
                margin: "0 auto 15px",
                borderRadius: "50%",
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                background: "#e8f5ed",
                border: "4px solid #dff3e7",
                fontSize: "35px"
              }}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Telegram profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              ) : (
                "👤"
              )}
            </div>

            <h2
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "21px",
                fontWeight: 800,
                color: "#192c22"
              }}
            >
              {profileName}
            </h2>

            <p
              style={{
                marginTop: "6px",
                color: "#087b50",
                fontSize: "13px",
                fontWeight: 600
              }}
            >
              {username ? `@${username}` : "Telegram username unavailable"}
            </p>

            <div
              style={{
                display: "inline-block",
                marginTop: "16px",
                padding: "7px 13px",
                background: "#e8f6ed",
                color: "#087b50",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700
              }}
            >
              Pocketly member
            </div>
          </div>

          <h3 style={{ fontSize: "16px", marginBottom: "14px" }}>
            Account information
          </h3>

          <ProfileRow
            icon="👤"
            label="Full name"
            value={fullName}
          />

          <ProfileRow
            icon="✉️"
            label="Username"
            value={username ? `@${username}` : null}
          />

          <ProfileRow
            icon="🆔"
            label="Telegram ID"
            value={telegramId ? String(telegramId) : null}
          />

          <ProfileRow
            icon="🌍"
            label="Language"
            value={language ? language.toUpperCase() : null}
          />

          <ProfileRow
            icon="🔐"
            label="Connection"
            value={telegramUser ? "Telegram profile detected" : "Not detected"}
          />

          <div className="notice" style={{ marginTop: "20px" }}>
            <p>
              Your profile information is displayed from Telegram.
              Secure account verification will be handled by Pocketly's
              backend before rewards or withdrawals are processed.
            </p>
          </div>
        </section>
      );
    }

    return (
      <>
        <section className="welcome">
          <p>
            {telegramUser?.first_name
              ? `WELCOME, ${telegramUser.first_name.toUpperCase()}`
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
          style={{
            border: "none",
            padding: 0,
            overflow: "hidden",
            cursor: "pointer"
          }}
        >
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Profile"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%"
              }}
            />
          ) : (
            "👤"
          )}
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
