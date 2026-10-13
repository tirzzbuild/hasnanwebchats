import { kv } from "@vercel/kv";

const normalizePhone = value => typeof value === "string" && /^\+[1-9]\d{5,14}$/.test(value);
const validOwner = value => normalizePhone(value);
const keyFor = owner => `hasnanchat:contacts:${owner}`;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const owner = String(req.query.owner || "");
    if (!validOwner(owner)) return res.status(400).json({ error: "Nomor pemilik tidak valid" });
    try {
      const contacts = await kv.get(keyFor(owner));
      return res.status(200).json({ contacts: Array.isArray(contacts) ? contacts : [] });
    } catch {
      return res.status(503).json({ error: "Penyimpanan bersama belum dikonfigurasi" });
    }
  }
  if (req.method === "POST") {
    const { owner, contact } = req.body || {};
    if (!validOwner(owner)) return res.status(400).json({ error: "Nomor pemilik tidak valid" });
    if (!contact || typeof contact !== "object" || typeof contact.name !== "string" ||
        contact.name.trim().length < 1 || contact.name.length > 70 || !normalizePhone(contact.phone) ||
        typeof contact.id !== "string" || contact.id.length > 100) {
      return res.status(400).json({ error: "Data kontak tidak valid" });
    }
    try {
      const contacts = await kv.get(keyFor(owner)) || [];
      if (!Array.isArray(contacts)) return res.status(500).json({ error: "Data kontak tidak valid di penyimpanan" });
      if (contacts.some(item => item.phone === contact.phone)) return res.status(409).json({ error: "Kontak sudah ada" });
      const safeContact = {
        id: contact.id, name: contact.name.trim(), phone: contact.phone,
        lastMessage: "", lastTime: "", unread: 0, photo: ""
      };
      contacts.push(safeContact);
      await kv.set(keyFor(owner), contacts);
      return res.status(201).json({ contact: safeContact, contacts });
    } catch {
      return res.status(503).json({ error: "Tidak dapat menyimpan kontak ke penyimpanan bersama" });
    }
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
