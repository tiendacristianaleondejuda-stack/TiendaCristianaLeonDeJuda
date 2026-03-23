export default async function handler(req, res) {

  const ONESIGNAL_APP_ID = '98d7158a-84e7-46e1-9e64-f61678fbfd06';

  const ONESIGNAL_API_KEY = 'os_v2_app_tdlrlcue45dodhte6ylhr675a3zl264dujru6uufev5ftvm2mjpmcv2nyqcl7ldwrgpq4czykeyr4bbtx22auykndrmaqpear54if6a';

  try {

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 👇 IMPORTANTE: este formato exacto
        'Authorization': 'Key ' + ONESIGNAL_API_KEY,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { es: 'Prueba' },
        contents: { es: 'Notificación de prueba' },
      }),
    });

    const data = await response.json();

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
