// ================================================================
//  notificaciones.js — Push con ntfy.sh (sin API keys)
//  ntfy es gratuito, funciona en Android e iOS sin configuración
// ================================================================

// ── Configuración ntfy ───────────────────────────────────────────
// El "topic" es como un canal privado — cambialo por algo único
// que solo vos conozcas para que nadie más pueda enviarte mensajes
const NTFY_TOPIC = 'leondejuda-admin-cristiana-2025';  // ← podés cambiar esto

const SITE_URL = 'https://tiendacristianaleondejuda.vercel.app';

// ── OneSignal (solo para registrar el device del admin al panel) ─
const ONESIGNAL_APP_ID   = '98d7158a-84e7-46e1-9e64-f61678fbfd06';
const ONESIGNAL_CONFIGURADO = true;

if (typeof window !== 'undefined') {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  OneSignalDeferred.push(async function(OneSignal) {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerParam: { scope: '/' },
        notifyButton: { enable: false },
      });
      console.info('[OneSignal] Inicializado (para in-app)');
    } catch(e) {
      console.warn('[OneSignal]', e.message);
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
    btn.style.color       = '#4ade80';
    btn.style.borderColor = 'rgba(74,222,128,.35)';
    btn.style.background  = 'rgba(74,222,128,.1)';
    if (icon)  icon.className   = 'bi bi-bell-fill';
    if (label) label.textContent = 'Alertas activas';
  } else if (estado === 'denied') {
    btn.style.color       = '#f87171';
    btn.style.borderColor = 'rgba(248,113,113,.35)';
    btn.style.background  = 'rgba(248,113,113,.1)';
    if (icon)  icon.className   = 'bi bi-bell-slash';
    if (label) label.textContent = 'Bloqueadas';
  } else {
    btn.style.color       = 'var(--text-muted)';
    btn.style.borderColor = 'var(--border)';
    btn.style.background  = 'var(--bg3)';
    if (icon)  icon.className   = 'bi bi-bell';
    if (label) label.textContent = 'Activar alertas';
  }
}

// ── Pedir permiso (para alertas in-app en el panel) ─────────────
async function pedirPermisoNotificaciones() {
  const estado = Notification?.permission || 'default';

  if (estado === 'denied') {
    alert(
      '⛔ Las notificaciones están BLOQUEADAS.\n\n' +
      'Para activarlas:\n' +
      '• Android Chrome: tocá el candado 🔒 en la barra → Notificaciones → Permitir\n' +
      '• PC Chrome: hacé clic en el candado 🔒 → Notificaciones → Permitir\n\n' +
      'Después recargá la página.'
    );
    return;
  }

  if (estado === 'granted') {
    // Mostrar instrucciones para ntfy
    alert(
      '✅ Alertas del panel activadas.\n\n' +
      '📱 Para recibir alertas en tu celular aunque tengas la app cerrada:\n\n' +
      '1. Instalá la app "ntfy" desde Google Play o App Store\n' +
      '2. Abrila y tocá el "+" para agregar un canal\n' +
      '3. Escribí exactamente: ' + NTFY_TOPIC + '\n' +
      '4. ¡Listo! Recibirás alertas de pedidos y mensajes nuevos.'
    );
    return;
  }

  try {
    const resultado = await Notification.requestPermission();
    actualizarBotonNotif();
    if (resultado === 'granted') {
      alert(
        '✅ ¡Alertas del panel activadas!\n\n' +
        '📱 Para alertas en tu celular cuando la app está cerrada:\n\n' +
        '1. Instalá "ntfy" desde Google Play o App Store (es gratis)\n' +
        '2. Tocá "+" y escribí el canal: ' + NTFY_TOPIC + '\n' +
        '3. ¡Listo!'
      );
    }
  } catch(e) {
    console.warn('Error al pedir permiso:', e.message);
  }
}

// ── Enviar notificación push vía ntfy ───────────────────────────
async function _enviarPushNtfy(titulo, cuerpo, emoji) {
  try {
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: {
        'Title':    titulo,
        'Tags':     emoji,
        'Priority': 'high',
        'Click':    SITE_URL + '/pages/admin/panel.html',
        'Content-Type': 'text/plain',
      },
      body: cuerpo,
    });
    console.info('[ntfy] ✅ Notificación enviada');
  } catch(e) {
    console.warn('[ntfy] No se pudo enviar:', e.message);
  }
}

// ── Notificar nuevo pedido ───────────────────────────────────────
async function notificarNuevoPedido(pedidoId, total) {
  await _enviarPushNtfy(
    'Nuevo pedido recibido',
    `Pedido #${pedidoId.substring(0,8).toUpperCase()} · ${total}`,
    'shopping_bags'
  );
}

// ── Notificar mensaje de cliente ─────────────────────────────────
async function notificarMensajeAdmin(nombre, preview) {
  await _enviarPushNtfy(
    `Mensaje de ${nombre}`,
    `"${preview}"`,
    'speech_balloon'
  );
}
