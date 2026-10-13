import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    await kv.set("hasnanchat:health", Date.now(), { ex: 60 });
    return res.status(200).json({ ok: true, storage: "kv" });
  } catch {
    return res.status(503).json({ ok: false, error: "KV belum dikonfigurasi" });
  }
}
