
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function safeCompare(a, b) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  return (
    first.length === second.length &&
    timingSafeEqual(first, second)
  );
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const {
      POSTBACK_SECRET,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    } = process.env;

    if (!POSTBACK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).send("Server configuration missing");
    }

    const { secret, ymid, event_type, reward_event_type } = req.query;

    if (
      typeof secret !== "string" ||
      !safeCompare(secret, POSTBACK_SECRET)
    ) {
      return res.status(403).send("Forbidden");
    }

    if (typeof ymid !== "string" || !ymid || ymid.length > 200) {
      return res.status(400).send("Invalid event ID");
    }

    const separator = ymid.indexOf("_");

    if (separator === -1) {
      return res.status(400).send("Invalid event ID");
    }

    const telegramIdText = ymid.slice(0, separator);

    if (!/^\d+$/.test(telegramIdText)) {
      return res.status(400).send("Invalid Telegram ID");
    }

    const telegramId = Number(telegramIdText);

    if (!Number.isSafeInteger(telegramId)) {
      return res.status(400).send("Invalid Telegram ID");
    }

    if (event_type !== "impression") {
      return res.status(200).send("Event ignored");
    }

    if (reward_event_type !== "valued") {
      return res.status(200).send("No reward");
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

    const { data, error } = await supabase.rpc(
      "credit_ad_reward",
      {
        p_telegram_id: telegramId,
        p_event_id: ymid
      }
    );

    if (error) {
      console.error("Pocketly reward error:", error.message);
      return res.status(500).send("Reward processing failed");
    }

    // Check referral eligibility after every valid valued callback.
    // This also allows a retry to complete a referral reward if needed.
    const { data: referralData, error: referralError } =
      await supabase.rpc(
        "reward_referral",
        {
          p_referred_telegram_id: telegramId
        }
      );

    if (referralError) {
      console.error("Pocketly referral error:", referralError.message);
      return res.status(500).send("Referral processing failed");
    }

    if (referralData === true) {
      return res.status(200).send(
        "10 points credited; inviter received 50 referral points"
      );
    }

    return res.status(200).send(
      data ? "10 points credited" : "Duplicate or daily limit reached"
    );

  } catch (error) {
    console.error("Pocketly postback error:", error.message);
    return res.status(500).send("Server error");
  }
}
