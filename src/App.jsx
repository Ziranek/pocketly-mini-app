
import React, { useState, useEffect } from "react";

function App() {
  const [tab, setTab] = useState("Home");
  const [message, setMessage] = useState("");
  const [adLoading, setAdLoading] = useState(false);
  const [telegramUser, setTelegramUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [referrals, setReferrals] = useState([]);
  const [referralCount, setReferralCount] = useState(0);
  const [qualifiedReferrals, setQualifiedReferrals] = useState(0);

  const updateReferralData = (result) => {
    setReferrals(result.referrals || []);
    setReferralCount(Number(result.referralCount) || 0);
    setQualifiedReferrals(Number(result.qualifiedReferrals) || 0);
  };

  useEffect(() => {
    let active = true;

    const connectPocketly = async () => {
      const tg = window.Telegram?.WebApp;

      if (!tg) {
        setConnectionStatus("Open Pocketly in Telegram");
        return;
      }

      tg.ready();
      tg.expand();

      try {
        tg.setHeaderColor("#ffffff");
        tg.setBackgroundColor("#f4f7f5");
      } catch {
        console.log("Telegram display settings unavailable.");
      }

      const user = tg.initDataUnsafe?.user || null;

      if (active) setTelegramUser(user);

      if (!tg.initData) {
        setConnectionStatus("Telegram verification unavailable");
        return;
      }

      try {
        const response = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: tg.initData })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Verification failed");
        }

        if (active) {
          setPoints(Number(result.profile.points) || 0);
          updateReferralData(result);
          setConnectionStatus("Verified and connected");
        }
      } catch (error) {
        console.error("Pocketly connection error:", error);

        if (active) {
          setConnectionStatus("Verification failed");
          setMessage(
            "We couldn't verify your account. Please reopen Pocketly and try again."
          );
        }
      }
    };

    connectPocketly();

    return () => {
      active = false;
    };
  }, []);

  const notify = (text) => setMessage(text);

  const refreshBalance = async () => {
    const tg = window.Telegram?.WebApp;

    if (!tg?.initData) return null;

    try {
      const response = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg.initData })
      });

      if (!response.ok) return null;

      const result = await response.json();

      if (!result.success) return null;

      const latestPoints = Number(result.profile.points) || 0;

      setPoints(latestPoints);
      updateReferralData(result);

      return latestPoints;
    } catch (error) {
      console.error("Pocketly refresh error:", error);
      return null;
    }
  };

  const watchAdvertisements = async () => {
    if (adLoading) return;

    if (connectionStatus !== "Verified and connected") {
      notify("Please wait until your Telegram account is verified.");
      return;
    }

    const showAd = window.show_12353520;

    if (typeof showAd !== "function") {
      notify("The advertisement service is unavailable. Please try again.");
      return;
    }

    if (!telegramUser?.id) {
      notify("Telegram user information is unavailable.");
      return;
    }

    setAdLoading(true);
    setMessage("Preparing your advertisement...");

    try {
      const startingPoints = points;
      const ymid = `${telegramUser.id}_${crypto.randomUUID()}`;

      const result = await showAd({
        ymid,
        requestVar: "home_watch_ad"
      });

      if (result?.reward_event_type !== "valued") {
        notify("No paid reward was confirmed. No points were added.");
        return;
      }

      notify("Ad completed. Waiting for your reward confirmation...");

      let rewardReceived = false;

      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const latestPoints = await refreshBalance();

        if (
          latestPoints !== null &&
          latestPoints >= startingPoints + 10
        ) {
          rewardReceived = true;
          break;
        }
      }

      if (rewardReceived) {
        notify("Success! Your 10-point reward has been added.");
      } else {
        notify(
          "Your ad was completed. Your reward is still being processed. Please check your balance again shortly."
        );
      }
    } catch (error) {
      console.error("Pocketly ad error:", error);
      notify("Advertisement unavailable. Please try again later.");
    } finally {
      setAdLoading(false);
    }
  };

  const getInviteLink = () => {
    if (!telegramUser?.id) return "";

    return `https://t.me/Pocketlyearnbot?start=ref_${telegramUser.id}`;
  };

  const copyInviteLink = async () => {
    const link = getInviteLink();

    if (!link) {
      notify("Your referral link is not ready yet.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        notify("Your personal referral link has been copied!");
      } else {
        const input = document.createElement("textarea");
        input.value = link;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();

        const copied = document.execCommand("copy");
        document.body.removeChild(input);

        notify(
          copied
            ? "Your referral link has been copied!"
            : "Please copy your referral link manually: " + link
        );
      }
    } catch {
      notify("Copy failed. Please copy your link manually: " + link);
    }
  };

  const inviteFriends = async () => {
    const link = getInviteLink();

    if (!link) {
      notify("Your referral link is not ready yet.");
      return;
    }

    const shareUrl =
      "https://t.me/share/url?url=" +
      encodeURIComponent(link) +
      "&text=" +
      encodeURIComponent(
        "Join me on Pocketly! Complete rewarded ads and explore rewards."
      );

    try {
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(shareUrl);
      } else if (navigator.share) {
        await navigator.share({
          title: "Join Pocketly",
          text: "Join me on Pocketly!",
          url: link
        });
      } else {
        await copyInviteLink();
      }
    } catch {
      notify("You can share your personal referral link: " + link);
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

  const BalanceCard = ({ title }) => (
    <div className="balance">
      <p>{title}</p>
      <h1>{points.toLocaleString()} <span>PTS</span></h1>
      <small>Your verified rewards will appear here.</small>
    </div>
  );

  const renderContent = () => {
    if (tab === "Rewards") {
      return (
        <section className="section">
          <h3>Your rewards</h3>
          <BalanceCard title="AVAILABLE POINTS" />

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
          <h3>Invite and earn</h3>
          <p>Share Pocketly with friends and earn referral rewards.</p>

          <div className="balance">
            <p>YOUR PERSONAL REFERRAL LINK</p>

            <div
              style={{
                background: "#f4f7f5",
                borderRadius: "12px",
                padding: "13px",
                marginTop: "12px",
                wordBreak: "break-all",
                fontSize: "13px",
                color: "#087b50",
                fontWeight: 700
              }}
            >
              {getInviteLink() || "Loading your referral link..."}
            </div>

            <button
              className="action-button"
              onClick={copyInviteLink}
              style={{ marginTop: "14px" }}
            >
              Copy referral link
            </button>

            <button
              className="action-button"
              onClick={inviteFriends}
              style={{
                marginTop: "10px",
                background: "#192c22"
              }}
            >
              Invite friends
            </button>

            <small style={{ display: "block", marginTop: "15px" }}>
              Your friend must complete 20 successfully rewarded ads
              before you receive 50 referral points.
            </small>
          </div>

          <h3 style={{ marginTop: "25px" }}>Referral overview</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginTop: "14px"
            }}
          >
            <div className="balance">
              <p>TOTAL REFERRALS</p>
              <h1>{referralCount}</h1>
            </div>

            <div className="balance">
              <p>QUALIFIED</p>
              <h1>{qualifiedReferrals}</h1>
            </div>
          </div>

          <div className="balance" style={{ marginTop: "12px" }}>
            <p>TOTAL REFERRAL POINTS EARNED</p>
            <h1>{(qualifiedReferrals * 50).toLocaleString()} <span>PTS</span></h1>
          </div>

          <h3 style={{ marginTop: "25px" }}>People you've invited</h3>

          {referrals.length === 0 ? (
            <div className="notice" style={{ marginTop: "14px" }}>
              <p>
                You haven't referred anyone yet. Share your personal
                link to start growing your network!
              </p>
            </div>
          ) : (
            <div style={{ marginTop: "14px" }}>
              {referrals.map((person) => (
                <div
                  className="activity"
                  key={person.telegram_id}
                  style={{ marginBottom: "10px" }}
                >
                  <div className="activity-icon">👤</div>

                  <div className="activity-info">
                    <strong>{person.name}</strong>
                    <small>
                      {person.ads_completed} of 20 rewarded ads completed
                    </small>

                    <div
                      style={{
                        height: "6px",
                        background: "#e7eee9",
                        borderRadius: "10px",
                        overflow: "hidden",
                        marginTop: "8px"
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(person.ads_completed / 20 * 100, 100)}%`,
                          background: "#087b50",
                          borderRadius: "10px"
                        }}
                      />
                    </div>

                    <small
                      style={{
                        display: "block",
                        marginTop: "7px",
                        color: person.qualified ? "#087b50" : "#87958c",
                        fontWeight: 700
                      }}
                    >
                      {person.qualified
                        ? "Qualified · 50 points earned"
                        : "In progress"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="action-button"
            onClick={async () => {
              await refreshBalance();
              notify("Your referral information has been refreshed.");
            }}
            style={{ marginTop: "18px" }}
          >
            Refresh referral list
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
              ) : "👤"}
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

          <ProfileRow icon="👤" label="Full name" value={fullName} />
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
            label="Verification"
            value={connectionStatus}
          />

          <div className="notice" style={{ marginTop: "20px" }}>
            <p>
              Your Telegram account is verified through Pocketly's
              secure backend before account rewards are processed.
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

        <BalanceCard title="YOUR POINT BALANCE" />

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

          <button className="activity" onClick={() => setTab("Rewards")}>
            <div className="activity-icon">🎁</div>
            <div className="activity-info">
              <strong>My rewards</strong>
              <small>Explore your rewards and points.</small>
            </div>
            <span>→</span>
          </button>

          <button className="activity" onClick={() => setTab("Invite")}>
            <div className="activity-icon">👥</div>
            <div className="activity-info">
              <strong>Invite friends</strong>
              <small>Share your personal Pocketly referral link.</small>
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
          ) : "👤"}
        </button>
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
