import { kv } from "@vercel/kv";

const validPhone = value => typeof value === "string" && /^\+[1-9]\d{5,14}$/.test(value);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = req.body?.user;
  if (!user || !validPhone(user.phone) || typeof user.name !== "string" ||
      user.name.trim().length < 1 || user.name.length > 70 ||
      typeof (user.bio || "") !== "string" || (user.bio || "").length > 160 ||
      typeof (user.photo || "") !== "string" || (user.photo || "").length > 3_000_000) {
    return res.status(400).json({ error: "Data profil tidak valid" });
  }
  try {
    const profile = { phone: user.phone, name: user.name.trim(), bio: user.bio || "", photo: user.photo || "" };
    await kv.set(`hasnanchat:profile:${user.phone}`, profile);
    return res.status(200).json({ profile });
  } catch {
    return res.status(503).json({ error: "Penyimpanan bersama belum dikonfigurasi" });
  }
}
