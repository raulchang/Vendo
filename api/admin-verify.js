export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { code } = req.body || {};
  const secret = process.env.VENDO_ADMIN_SECRET;
  if (!secret) return res.status(500).json({ ok: false });
  if (code && code === secret) {
    return res.status(200).json({ ok: true });
  }
  return res.status(200).json({ ok: false });
}
