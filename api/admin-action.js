import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, action, ...params } = req.body || {};

  if (!code || code !== process.env.VENDO_ADMIN_SECRET) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  if (!process.env.SUPABASE_URL) return res.status(500).json({ error: 'SUPABASE_URL manquant' });
  if (!process.env.SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY manquant' });

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  let result;

  switch (action) {

    case 'ban_user': {
      const { id, banned } = params;
      if (!id) return res.status(400).json({ error: 'id manquant' });
      result = await db.from('profiles').update({ banned: !!banned }).eq('id', id);
      break;
    }

    case 'set_featured': {
      const { id, days } = params;
      if (!id) return res.status(400).json({ error: 'id manquant' });
      const featured_until = days > 0
        ? new Date(Date.now() + days * 86400000).toISOString()
        : null;
      result = await db.from('profiles').update({ featured_until }).eq('id', id);
      break;
    }

    case 'gift_slots': {
      const { id, slots } = params;
      if (!id || !slots) return res.status(400).json({ error: 'params manquants' });
      const { data: profile } = await db
        .from('profiles')
        .select('gift_slots')
        .eq('id', id)
        .maybeSingle();
      const current = profile?.gift_slots || 0;
      result = await db
        .from('profiles')
        .update({ gift_slots: current + slots })
        .eq('id', id);
      break;
    }

    case 'hide_post': {
      const { id } = params;
      if (!id) return res.status(400).json({ error: 'id manquant' });
      result = await db.from('posts').update({ is_sold: true }).eq('id', id);
      break;
    }

    case 'delete_post': {
      const { id } = params;
      if (!id) return res.status(400).json({ error: 'id manquant' });
      result = await db.from('posts').delete().eq('id', id);
      break;
    }

    case 'delete_user': {
      const { id } = params;
      if (!id) return res.status(400).json({ error: 'id manquant' });
      result = await db.from('profiles').delete().eq('id', id);
      break;
    }

    default:
      return res.status(400).json({ error: 'Action inconnue: ' + action });
  }

  if (result?.error) return res.status(500).json({ error: result.error.message });
  return res.status(200).json({ ok: true });
}
