import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, type, id } = req.body || {};

  if (code !== process.env.VENDO_ADMIN_SECRET) {
    return res.status(403).json({ error: 'Non autorisé' });
  }
  if (!type || !id) return res.status(400).json({ error: 'Paramètres manquants' });

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  let error;
  if (type === 'user') {
    ({ error } = await db.from('profiles').delete().eq('id', id));
  } else if (type === 'post') {
    ({ error } = await db.from('posts').delete().eq('id', id));
  }

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
