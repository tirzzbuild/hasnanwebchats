import { kv } from "@vercel/kv";

const validPhone = value => typeof value === "string" && /^\+[1-9]\d{5,14}$/.test(value);
const messageKey = (owner, peer) => `hasnanchat:messages:${[owner, peer].sort().join(":")}`;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const owner = String(req.query.owner || "");
    const peer = String(req.query.peer || "");
    if (!validPhone(owner) || !validPhone(peer)) return res.status(400).json({ error: "Nomor percakapan tidak valid" });
    try {
      const messages = await kv.get(messageKey(owner, peer));
      return res.status(200).json({ messages: Array.isArray(messages) ? messages : [] });
    } catch {
      return res.status(503).json({ error: "Penyimpanan bersama belum dikonfigurasi" });
    }
  }
  if (req.method === "POST") {
    const { owner, peer, message } = req.body || {};
    if (!validPhone(owner) || !validPhone(peer) || !message || typeof message.text !== "string" ||
        !message.text.trim() || message.text.length > 4000 || message.sender !== owner) {
      return res.status(400).json({ error: "Data pesan tidak valid" });
    }
    try {
      const key = messageKey(owner, peer);
      const messages = await kv.get(key) || [];
      if (!Array.isArray(messages)) return res.status(500).json({ error: "Data pesan tidak valid di penyimpanan" });
      const safeMessage = {
        id: String(message.id || Date.now()).slice(0, 100),
        sender: owner,
        text: message.text.trim(),
        time: String(message.time || "").slice(0, 20),
        createdAt: new Date().toISOString()
      };
      messages.push(safeMessage);
      await kv.set(key, messages.slice(-500));
      return res.status(201).json({ message: safeMessage });
    } catch {
      return res.status(503).json({ error: "Penyimpanan pesan bersama belum dikonfigurasi" });
    }
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
