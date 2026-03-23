// ================================================================
//  notificaciones.js — OneSignal + alertas de pedidos y mensajes
// ================================================================

const ONESIGNAL_APP_ID       = '98d7158a-84e7-46e1-9e64-f61678fbfd06';
const ONESIGNAL_REST_API_KEY = 'os_v2_app_tdlrlcue45dodhte6ylhr675a3zl264dujru6uufev5ftvm2mjpmcv2nyqcl7ldwrgpq4czykeyr4bbtx22auykndrmaqpear54if6a';
const SITE_URL  = 'https://tiendacristianaleondejuda.vercel.app';
const ICONO_URL = SITE_URL + '/assets/icons/icon-192x192.png';

const ONESIGNAL_CONFIGURADO = ONESIGNAL_APP_ID !== 'TU_APP_ID_DE_ONESIGNAL_AQUI';

// ── Inicializar OneSignal ────────────────────────────────────────
if (ONESIGNAL_CONFIGURADO) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  OneSignalDeferred.push(async function(OneSignal) {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerParam: { scope: '/' },
        notifyButton: { enable: false },
        promptOptions: {
          slidedown: {
            prompts: [{
              type: 'push',
              autoPrompt: false,
              text: {
                actionMessage: 'Recibí alertas de pedidos y mensajes nuevos.',
                acceptButton:  'Activar',
                cancelButton:  'Ahora no',
              },
            }],
          },
        },
      });

      // Etiquetar al admin
      try {
        const user = await getUsuario?.();
        if (user && user.email === ADMIN_EMAIL) {
          await OneSignal.User.addTag('rol',   'admin');
          await OneSignal.User.addTag('email', user.email);
          console.info('[OneSignal] ✅ Admin registrado');
        }
      } catch(e) {}

      // Actualizar botón
      actualizarBotonNotif();

    } catch(err) {
      console.warn('[OneSignal]', err.message);
      actualizarBotonNotif();
    }
  });
}

// ── Estado del botón de notificaciones ──────────────────────────
function actualizarBotonNotif() {
  const btn   = document.getElementById('btn-notif');
  const icon  = document.getElementById('notif-icon');
  const label = document.getElementById('notif-label');
  if (!btn) return;

  const estado = Notification?.permission || 'default';

  if (estado === 'granted') {
    btn.style.color        = '#4ade80';
    btn.style.borderColor  = 'rgba(74,222,128,.35)';
    btn.style.background   = 'rgba(74,222,128,.1)';
    if (icon)  icon.className  = 'bi bi-bell-fill';
    if (label) label.textContent = 'Alertas activas';
  } else if (estado === 'denied') {
    btn.style.color        = '#f87171';
    btn.style.borderColor  = 'rgba(248,113,113,.35)';
    btn.style.background   = 'rgba(248,113,113,.1)';
    if (icon)  icon.className  = 'bi bi-bell-slash';
    if (label) label.textContent = 'Bloqueadas';
  } else {
    btn.style.color        = 'var(--text-muted)';
    btn.style.borderColor  = 'var(--border)';
    btn.style.background   = 'var(--bg3)';
    if (icon)  icon.className  = 'bi bi-bell';
    if (label) label.textContent = 'Activar alertas';
  }
}

// ── Pedir permiso ────────────────────────────────────────────────
async function pedirPermisoNotificaciones() {
  const estado = Notification?.permission || 'default';

  if (estado === 'denied') {
    alert(
      '⛔ Las notificaciones están BLOQUEADAS.\n\n' +
      'Para activarlas:\n' +
      '• Android Chrome: toca el candado 🔒 en la barra de dirección → Notificaciones → Permitir\n' +
      '• PC Chrome: haz clic en el candado 🔒 → Notificaciones → Permitir\n' +
      '\nDespués recargá la página.'
    );
    return;
  }

  if (estado === 'granted') {
    alert('✅ Las alertas ya están activadas en este dispositivo.');
    return;
  }

  if (!ONESIGNAL_CONFIGURADO) {
    alert('OneSignal aún no está configurado.');
    return;
  }

  try {
    const resultado = await Notification.requestPermission();

    if (resultado === 'granted') {
      // Suscribir en OneSignal
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try { await OneSignal.Notifications.requestPermission(); } catch(e) {}
        const user = await getUsuario?.();
        if (user && user.email === ADMIN_EMAIL) {
          await OneSignal.User.addTag('rol',   'admin');
          await OneSignal.User.addTag('email', user.email);
        }
      });
      actualizarBotonNotif();
      alert('✅ ¡Alertas activadas! Recibirás notificaciones de pedidos y mensajes nuevos.');
    } else {
      actualizarBotonNotif();
    }
  } catch(err) {
    console.warn('[OneSignal] Error al pedir permiso:', err.message);
  }
}

// ── Enviar push para nuevo pedido ────────────────────────────────
async function notificarNuevoPedido(pedidoId, total) {
  if (!ONESIGNAL_CONFIGURADO) return;
  await _enviarPushAdmin('pedido', { pedidoId, total });
}

// ── Enviar push para mensaje nuevo ───────────────────────────────
async function notificarMensajeAdmin(nombre, preview) {
  if (!ONESIGNAL_CONFIGURADO) return;
  await _enviarPushAdmin('mensaje', { nombre, preview });
}

// ── Helper: llama a la Edge Function de Supabase (evita CORS) ───
//  La Edge Function es la que llama a OneSignal desde el servidor
async function _enviarPushAdmin(tipo, payload) {
  try {
    // URL de la Edge Function: Project URL + /functions/v1/notify
    const edgeFnUrl = SUPABASE_URL.replace('.supabase.co', '.supabase.co') + '/functions/v1/notify';

    const resp = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ tipo, ...payload }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const e = JSON.stringify(data.errors || data);
      if (e.includes('subscribed') || e.includes('No subscribers')) {
        console.info('[Push] Admin aún no activó las notificaciones push.');
      } else {
        console.warn('[Push] Error desde Edge Function:', e);
      }
    } else {
      console.info('[Push] ✅ Notificación enviada:', data.id);
    }
  } catch(err) {
    console.warn('[Push] No se pudo enviar:', err.message);
  }
}
