module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, action, ...params } = req.body || {};

  if (!code || code !== process.env.VENDO_ADMIN_SECRET) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const SUPA_URL = process.env.SUPABASE_URL;
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPA_URL) return res.status(500).json({ error: 'SUPABASE_URL manquant' });
  if (!SUPA_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY manquant' });

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPA_KEY,
    'Authorization': 'Bearer ' + SUPA_KEY,
    'Prefer': 'return=minimal'
  };

  async function sbUpdate(table, id, data) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    });
    if (!r.ok) { const t = await r.text(); throw new Error(t); }
  }

  async function sbSelect(table, id, col) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}&select=${col}`, {
      headers: { ...headers, 'Accept': 'application/json' }
    });
    if (!r.ok) throw new Error(await r.text());
    const rows = await r.json();
    return rows[0] || null;
  }

  async function sbDelete(table, id) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers
    });
    if (!r.ok) throw new Error(await r.text());
  }

  try {
    switch (action) {

      case 'ban_user': {
        const { id, banned } = params;
        if (!id) return res.status(400).json({ error: 'id manquant' });
        await sbUpdate('profiles', id, { banned: !!banned });
        break;
      }

      case 'set_featured': {
        const { id, days } = params;
        if (!id) return res.status(400).json({ error: 'id manquant' });
        const featured_until = days > 0
          ? new Date(Date.now() + days * 86400000).toISOString()
          : null;
        await sbUpdate('profiles', id, { featured_until });
        break;
      }

      case 'gift_slots': {
        const { id, slots } = params;
        if (!id || !slots) return res.status(400).json({ error: 'params manquants' });
        const row = await sbSelect('profiles', id, 'gift_slots');
        const current = row?.gift_slots || 0;
        await sbUpdate('profiles', id, { gift_slots: current + slots });
        break;
      }

      case 'hide_post': {
        const { id } = params;
        if (!id) return res.status(400).json({ error: 'id manquant' });
        await sbUpdate('posts', id, { is_sold: true });
        break;
      }

      case 'delete_post': {
        const { id } = params;
        if (!id) return res.status(400).json({ error: 'id manquant' });
        await sbDelete('posts', id);
        break;
      }

      case 'delete_user': {
        const { id } = params;
        if (!id) return res.status(400).json({ error: 'id manquant' });
        await sbDelete('profiles', id);
        break;
      }

      default:
        return res.status(400).json({ error: 'Action inconnue: ' + action });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: err.message, debug_url: (SUPA_URL||'').substring(0, 40) });
  }
};
