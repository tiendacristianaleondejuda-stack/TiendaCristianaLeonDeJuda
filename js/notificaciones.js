// ================================================================
//  notificaciones.js — OneSignal
// ================================================================

const ONESIGNAL_APP_ID = '98d7158a-84e7-46e1-9e64-f61678fbfd06';
const SITE_URL         = 'https://tiendacristianaleondejuda.vercel.app';
const ICONO_URL        = SITE_URL + '/assets/icons/icon-192x192.png';
const ONESIGNAL_CONFIGURADO = true;

// ── Inicializar OneSignal ────────────────────────────────────────
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

    actualizarBotonNotif();

  } catch(err) {
    console.warn('[OneSignal]', err.message);
    actualizarBotonNotif();
  }
});

// ── Estado del botón ─────────────────────────────────────────────
function actualizarBotonNotif() {
  const btn   = document.getElementById('btn-notif');
  const icon  = document.getElementById('notif-icon');
  const label = document.getElementById('notif-label');
  if (!btn) return;
  const estado = Notification?.permission || 'default';
  if (estado === 'granted') {
    btn.style.color = '#4ade80'; btn.style.borderColor = 'rgba(74,222,128,.35)'; btn.style.background = 'rgba(74,222,128,.1)';
    if (icon) icon.className = 'bi bi-bell-fill';
    if (label) label.textContent = 'Alertas activas';
  } else if (estado === 'denied') {
    btn.style.color = '#f87171'; btn.style.borderColor = 'rgba(248,113,113,.35)'; btn.style.background = 'rgba(248,113,113,.1)';
    if (icon) icon.className = 'bi bi-bell-slash';
    if (label) label.textContent = 'Bloqueadas';
  } else {
    btn.style.color = 'var(--text-muted)'; btn.style.borderColor = 'var(--border)'; btn.style.background = 'var(--bg3)';
    if (icon) icon.className = 'bi bi-bell';
    if (label) label.textContent = 'Activar alertas';
  }
}

// ── Pedir permiso ────────────────────────────────────────────────
async function pedirPermisoNotificaciones() {
  const estado = Notification?.permission || 'default';
  if (estado === 'denied') {
    alert('⛔ Las notificaciones están BLOQUEADAS.\n\nPara activarlas:\n• Android Chrome: tocá el candado 🔒 en la barra → Notificaciones → Permitir\n• PC Chrome: hacé clic en el candado 🔒 → Notificaciones → Permitir\n\nDespués recargá la página.');
    return;
  }
  if (estado === 'granted') { alert('✅ Las alertas ya están activadas en este dispositivo.'); return; }
  try {
    const resultado = await Notification.requestPermission();
    if (resultado === 'granted') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try { await OneSignal.Notifications.requestPermission(); } catch(e) {}
        const user = await getUsuario?.();
        if (user && user.email === ADMIN_EMAIL) {
          await OneSignal.User.addTag('rol', 'admin');
          await OneSignal.User.addTag('email', user.email);
        }
      });
      actualizarBotonNotif();
      alert('✅ ¡Alertas activadas!');
    } else {
      actualizarBotonNotif();
    }
  } catch(e) { console.warn('Error:', e.message); }
}

// ── Enviar push via Edge Function de Supabase ────────────────────
async function _enviarPush(tipo, payload) {
  try {
    const edgeFnUrl = SUPABASE_URL + '/functions/v1/notify';
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
      console.warn('[Push] Error:', JSON.stringify(data));
    } else {
      console.info('[Push] ✅ Enviado:', data.id);
    }
  } catch(e) {
    console.warn('[Push] No se pudo enviar:', e.message);
  }
}

async function notificarNuevoPedido(pedidoId, total) {
  await _enviarPush('pedido', { pedidoId, total });
}

async function notificarMensajeAdmin(nombre, preview) {
  await _enviarPush('mensaje', { nombre, preview });
}
