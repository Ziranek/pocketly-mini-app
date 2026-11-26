
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
    return JSON.parse(params.get("user") || "null");
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } =
      process.env;

    if (!TELEGRAM_BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Server configuration is incomplete" });
    }

    const initData = req.body?.initData;

    if (typeof initData !== "string" || !initData) {
      return res.status(400).json({ error: "Telegram data is missing" });
    }

    const user = verifyTelegramInitData(initData, TELEGRAM_BOT_TOKEN);

    if (!user || !Number.isSafeInteger(user.id)) {
      return res.status(401).json({ error: "Telegram verification failed" });
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

    const profile = {
      telegram_id: user.id,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      username: user.username || null,
      photo_url: user.photo_url || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(profile, { onConflict: "telegram_id" })
      .select("telegram_id, first_name, last_name, username, photo_url, points")
      .single();

    if (error) {
      console.error("Pocketly profile error:", error.message);
      return res.status(500).json({ error: "Could not save profile" });
    }

    return res.status(200).json({ success: true, profile: data });
  } catch (error) {
    console.error("Pocketly API error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
