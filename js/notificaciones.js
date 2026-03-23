// ================================================================
//  notificaciones.js — OneSignal + alertas de pedidos y mensajes
// ================================================================

const ONESIGNAL_APP_ID       = '98d7158a-84e7-46e1-9e64-f61678fbfd06';
const ONESIGNAL_REST_API_KEY = 'os_v2_app_tdlrlcue45dodhte6ylhr675a3zl264dujru6uufev5ftvm2mjpmcv2nyqcl7ldwrgpq4czykeyr4bbtx22auykndrmaqpear54if6a';
const SITE_URL  = 'https://tiendacristianaleondejuda.vercel.app/';
const ICONO_URL = SITE_URL + 'assets/icons/icon-192x192.png';

// ⚠️ IMPORTANTE: Forzar la ruta del Service Worker ANTES de init
window.OneSignal = window.OneSignal || [];
window.OneSignal.push(function() {
  window.OneSignal.SERVICE_WORKER_PATH = '/OneSignalSDKWorker.js';
  window.OneSignal.SERVICE_WORKER_UPDATER_PATH = '/OneSignalSDKUpdaterWorker.js';
});

// Inicializar
window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal) {
  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      notifyButton: { enable: false },
      promptOptions: {
        slidedown: {
          enabled: false,
        },
      },
    });

    console.log('[OneSignal] Inicializado correctamente');

    const user = await getUsuario?.();
    if (user && user.email === 'tiendacristianaleondejuda@gmail.com') {
      await OneSignal.User.addTag('rol', 'admin');
      await OneSignal.User.addTag('email', user.email);
      console.info('[OneSignal] ✅ Admin registrado');
    }

    actualizarBotonNotif();

  } catch(err) {
    console.warn('[OneSignal] Error:', err.message);
    actualizarBotonNotif();
  }
});

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
    btn.style.color        = '#7c8090';
    btn.style.borderColor  = 'rgba(255,255,255,.12)';
    btn.style.background   = 'rgba(255,255,255,.05)';
    if (icon)  icon.className  = 'bi bi-bell';
    if (label) label.textContent = 'Activar alertas';
  }
}

async function pedirPermisoNotificaciones() {
  const estado = Notification?.permission || 'default';

  if (estado === 'denied') {
    alert('Las notificaciones están BLOQUEADAS. Revisá la configuración del sitio.');
    return;
  }

  if (estado === 'granted') {
    alert('✅ Las alertas ya están activadas.');
    return;
  }

  try {
    const resultado = await Notification.requestPermission();

    if (resultado === 'granted') {
      window.OneSignalDeferred.push(async function(OneSignal) {
        try { 
          await OneSignal.Notifications.requestPermission(); 
          console.log('[OneSignal] Permiso concedido');
          
          const user = await getUsuario?.();
          if (user && user.email === 'tiendacristianaleondejuda@gmail.com') {
            await OneSignal.User.addTag('rol', 'admin');
            await OneSignal.User.addTag('email', user.email);
          }
        } catch(e) {
          console.warn('[OneSignal] Error:', e);
        }
      });
      actualizarBotonNotif();
      alert('✅ ¡Alertas activadas!');
    } else {
      actualizarBotonNotif();
    }
  } catch(err) {
    console.warn('[OneSignal] Error:', err.message);
  }
}

async function notificarNuevoPedido(pedidoId, total) {
  await _enviarPushAdmin(
    '🛍️ Nuevo pedido',
    `Pedido #${pedidoId.substring(0,8).toUpperCase()} · ${total}`
  );
}

async function notificarMensajeAdmin(nombre, preview) {
  await _enviarPushAdmin(
    `💬 Mensaje de ${nombre}`,
    `"${preview}"`
  );
}

async function _enviarPushAdmin(titulo, cuerpo) {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [{ field: 'tag', key: 'rol', relation: '=', value: 'admin' }],
        headings: { en: titulo, es: titulo },
        contents: { en: cuerpo, es: cuerpo },
        url: SITE_URL + 'pages/admin/panel.html',
        chrome_web_icon: ICONO_URL,
      }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.warn('[OneSignal] Error:', data.errors);
    } else {
      console.info('[OneSignal] ✅ Push enviado:', data.id);
    }
  } catch(err) {
    console.warn('[OneSignal] Error:', err.message);
  }
}
