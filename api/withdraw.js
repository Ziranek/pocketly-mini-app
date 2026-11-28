
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifyTelegram(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) return null;

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const a = Buffer.from(calculatedHash, "hex");
  const b = Buffer.from(hash, "hex");

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));

  if (
    !authDate ||
    Math.floor(Date.now() / 1000) - authDate > 86400
  ) {
    return null;
  }

  try {
    return JSON.parse(params.get("user"));
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { initData, points, payoutMethod, payoutDetails } =
      req.body || {};

    if (!initData) {
      return res.status(401).json({
        success: false,
        error: "Telegram verification required"
      });
    }

    const user = verifyTelegram(
      initData,
      process.env.TELEGRAM_BOT_TOKEN
    );

    if (!user?.id) {
      return res.status(401).json({
        success: false,
        error: "Invalid Telegram verification"
      });
    }

    const requestedPoints = Number(points);

    if (
      !Number.isSafeInteger(requestedPoints) ||
      requestedPoints < 2000
    ) {
      return res.status(400).json({
        success: false,
        error: "Minimum withdrawal is 2000 points"
      });
    }

    if (
      typeof payoutMethod !== "string" ||
      !["Bank Transfer"].includes(payoutMethod)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid payout method"
      });
    }

    if (
      typeof payoutDetails !== "string" ||
      payoutDetails.trim().length < 5 ||
      payoutDetails.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        error: "Please provide valid payment details"
      });
    }

    const { data, error } = await supabase.rpc(
      "request_withdrawal",
      {
        p_telegram_id: user.id,
        p_points: requestedPoints,
        p_payout_method: payoutMethod,
        p_payout_details: payoutDetails.trim()
      }
    );

    if (error) {
      console.error("Withdrawal request error:", error);

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      requestId: data,
      status: "pending",
      message: "Your withdrawal request has been submitted."
    });
  } catch (error) {
    console.error("Withdrawal API error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to process withdrawal right now."
    });
  }
}
