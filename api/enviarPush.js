// ================================================================
//  API VERCEL — ENVIAR NOTIFICACIONES (SEGURO)
// ================================================================

export default async function handler(req, res) {

  const ONESIGNAL_APP_ID = '98d7158a-84e7-46e1-9e64-f61678fbfd06';

  // ⚠️ PON TU API KEY REAL AQUÍ (la que empieza con os_v2_)
  const ONESIGNAL_API_KEY = 'os_v2_app_tdlrlcue45dodhte6ylhr675az4d5mgyz64ut2uekba42mb3fsu4c5mmtly5nen222xefwdym6hvhiovnjhadtjn5tlor3e6bpd3s5a';

  try {

    const { titulo, mensaje } = req.body || {};

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,

        // 👉 SOLO ADMIN
        filters: [
          { field: 'tag', key: 'rol', relation: '=', value: 'admin' }
        ],

        headings: {
          es: titulo || 'Nueva notificación'
        },

        contents: {
          es: mensaje || 'Tienes una nueva alerta'
        },

        url: 'https://tiendacristianaleondejuda.vercel.app/pages/admin/panel.html'
      }),
    });

    const data = await response.json();

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
