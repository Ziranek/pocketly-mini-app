
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function verifyTelegramInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");

  if (!receivedHash || !/^[a-f0-9]{64}$/i.test(receivedHash)) {
    return null;
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest();

  const receivedBuffer = Buffer.from(receivedHash, "hex");

  if (
    receivedBuffer.length !== calculatedHash.length ||
    !timingSafeEqual(receivedBuffer, calculatedHash)
  ) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));

  if (
    !Number.isFinite(authDate) ||
    authDate > Math.floor(Date.now() / 1000) + 60 ||
    Math.floor(Date.now() / 1000) - authDate > 86400
  ) {
    return null;
  }

  try {
    return {
      user: JSON.parse(params.get("user") || "null"),
      startParam: params.get("start_param")
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      TELEGRAM_BOT_TOKEN,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    } = process.env;

    if (!TELEGRAM_BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Server configuration is incomplete"
      });
    }

    const initData = req.body?.initData;

    if (typeof initData !== "string" || !initData) {
      return res.status(400).json({ error: "Telegram data is missing" });
    }

    const verified = verifyTelegramInitData(
      initData,
      TELEGRAM_BOT_TOKEN
    );

    const user = verified?.user;

    if (!user || !Number.isSafeInteger(user.id)) {
      return res.status(401).json({
        error: "Telegram verification failed"
      });
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    const { data: existingProfile, error: lookupError } = await supabase
      .from("profiles")
      .select("telegram_id")
      .eq("telegram_id", user.id)
      .maybeSingle();

    if (lookupError) {
      console.error("Pocketly profile lookup:", lookupError.message);
      return res.status(500).json({ error: "Could not check profile" });
    }

    let profile;

    if (existingProfile) {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          username: user.username || null,
          photo_url: user.photo_url || null,
          updated_at: new Date().toISOString()
        })
        .eq("telegram_id", user.id)
        .select("telegram_id, first_name, last_name, username, photo_url, points")
        .single();

      if (error) {
        console.error("Pocketly profile update:", error.message);
        return res.status(500).json({ error: "Could not update profile" });
      }

      profile = data;
    } else {
      let referrerId = null;
      const startParam = verified.startParam;

      if (
        typeof startParam === "string" &&
        /^ref_\d+$/.test(startParam)
      ) {
        const candidate = Number(startParam.slice(4));

        if (
          Number.isSafeInteger(candidate) &&
          candidate !== user.id
        ) {
          const { data: inviter, error: inviterError } = await supabase
            .from("profiles")
            .select("telegram_id")
            .eq("telegram_id", candidate)
            .maybeSingle();

          if (inviterError) {
            console.error("Pocketly inviter lookup:", inviterError.message);
            return res.status(500).json({ error: "Could not verify inviter" });
          }

          if (inviter) referrerId = candidate;
        }
      }

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          telegram_id: user.id,
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          username: user.username || null,
          photo_url: user.photo_url || null,
          referred_by_telegram_id: referrerId
        })
        .select("telegram_id, first_name, last_name, username, photo_url, points")
        .single();

      if (error) {
        console.error("Pocketly profile creation:", error.message);

        if (error.code === "23505") {
          return res.status(409).json({
            error: "Profile was created simultaneously. Please reopen Pocketly."
          });
        }

        return res.status(500).json({ error: "Could not create profile" });
      }

      profile = data;
    }

    // Fetch everyone who registered using this user's referral link.
    const { data: referredUsers, error: referredError } = await supabase
      .from("profiles")
      .select("telegram_id, first_name, last_name, username")
      .eq("referred_by_telegram_id", user.id);

    if (referredError) {
      console.error("Pocketly referred users:", referredError.message);
      return res.status(500).json({ error: "Could not load referrals" });
    }

    const referredIds = (referredUsers || []).map(
      referred => referred.telegram_id
    );

    let adCounts = {};
    let rewardedIds = new Set();

    if (referredIds.length > 0) {
      const { data: events, error: eventsError } = await supabase
        .from("reward_events")
        .select("telegram_id")
        .in("telegram_id", referredIds)
        .eq("status", "credited");

      if (eventsError) {
        console.error("Pocketly referral ad counts:", eventsError.message);
        return res.status(500).json({ error: "Could not load referral progress" });
      }

      for (const event of events || []) {
        adCounts[event.telegram_id] =
          (adCounts[event.telegram_id] || 0) + 1;
      }

      const { data: rewards, error: rewardsError } = await supabase
        .from("referrals")
        .select("referred_telegram_id")
        .eq("referrer_telegram_id", user.id);

      if (rewardsError) {
        console.error("Pocketly referral rewards:", rewardsError.message);
        return res.status(500).json({ error: "Could not load referral rewards" });
      }

      rewardedIds = new Set(
        (rewards || []).map(item => item.referred_telegram_id)
      );
    }

    const referralList = (referredUsers || []).map(referred => ({
      telegram_id: referred.telegram_id,
      name:
        [referred.first_name, referred.last_name].filter(Boolean).join(" ") ||
        (referred.username ? `@${referred.username}` : "Pocketly user"),
      ads_completed: adCounts[referred.telegram_id] || 0,
      qualified: rewardedIds.has(referred.telegram_id),
      points_earned: rewardedIds.has(referred.telegram_id) ? 50 : 0
    }));

    return res.status(200).json({
      success: true,
      profile,
      referralLink: `https://t.me/Pocketlyearnbot?start=ref_${user.id}`,
      referrals: referralList,
      referralCount: referralList.length,
      qualifiedReferrals: referralList.filter(item => item.qualified).length
    });

  } catch (error) {
    console.error("Pocketly API error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
