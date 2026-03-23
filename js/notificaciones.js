// ================================================================
//  notificaciones.js — OneSignal + alertas (VERSIÓN CORREGIDA)
// ================================================================

const ONESIGNAL_APP_ID = '98d7158a-84e7-46e1-9e64-f61678fbfd06';

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
      });

      // 👇 Registrar admin
      try {
        const user = await getUsuario?.();

        if (user && user.email === ADMIN_EMAIL) {
          await OneSignal.User.addTag('rol', 'admin');
          await OneSignal.User.addTag('email', user.email);
          console.log('[OneSignal] ✅ Admin registrado');
        }

      } catch(e) {}

      actualizarBotonNotif();

    } catch(err) {
      console.warn('[OneSignal]', err.message);
    }
  });
}

// ── BOTÓN ────────────────────────────────────────────────────────
function actualizarBotonNotif() {

  const btn = document.getElementById('btn-notif');
  if (!btn) return;

  const estado = Notification.permission;

  if (estado === 'granted') {
    btn.textContent = '🔔 Activadas';
  } else if (estado === 'denied') {
    btn.textContent = '❌ Bloqueadas';
  } else {
    btn.textContent = '🔔 Activar';
  }
}

// ── PEDIR PERMISO ────────────────────────────────────────────────
async function pedirPermisoNotificaciones() {

  const estado = Notification.permission;

  if (estado === 'granted') {
    alert('✅ Ya están activadas');
    return;
  }

  if (estado === 'denied') {
    alert('⛔ Están bloqueadas desde el navegador');
    return;
  }

  try {

    const permiso = await Notification.requestPermission();

    if (permiso === 'granted') {

      window.OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.Notifications.requestPermission();
      });

      actualizarBotonNotif();

      alert('✅ Notificaciones activadas');

    }

  } catch (error) {
    console.warn(error);
  }
}

// ── ENVIAR NOTIFICACIÓN (AHORA SEGURO) ───────────────────────────
async function enviarPush(titulo, mensaje) {

  try {

    const resp = await fetch('/api/enviarPush', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        titulo,
        mensaje
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.warn('❌ Error push:', data);
    } else {
      console.log('✅ Push enviado');
    }

  } catch (error) {
    console.warn('❌ Error:', error.message);
  }
}

// ── EVENTOS ─────────────────────────────────────────────────────
async function notificarNuevoPedido(pedidoId, total) {

  await enviarPush(
    '🛍️ Nuevo pedido',
    `Pedido #${pedidoId.substring(0,8)} - ${total}`
  );
}

async function notificarMensajeAdmin(nombre, mensaje) {

  await enviarPush(
    '💬 Nuevo mensaje',
    `${nombre}: ${mensaje}`
  );
}
