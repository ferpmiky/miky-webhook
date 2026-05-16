import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const eventName = req.headers['x-event-name'];
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (eventName === 'order_created') {
      const { data } = body;
      const email = data.attributes.user_email;
      const nombre = data.attributes.user_name;
      const ordenId = data.id;
      const producto = data.attributes.first_order_item?.product_name || 'Control Total';

      const { error } = await supabase
        .from('compradores')
        .upsert({
          email: email.toLowerCase().trim(),
          nombre,
          orden_id: ordenId,
          producto,
          fecha_compra: new Date().toISOString()
        }, { onConflict: 'email' });

      if (error) {
        console.error('Error Supabase:', error);
        return res.status(500).json({ error: 'Error guardando comprador' });
      }

      console.log('Comprador registrado: ' + email);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error webhook:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
