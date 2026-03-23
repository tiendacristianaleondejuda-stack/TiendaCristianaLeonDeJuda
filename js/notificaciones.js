// ================================================================
//  notificaciones.js — OneSignal + alertas de pedidos y mensajes
// ================================================================

const ONESIGNAL_APP_ID       = '98d7158a-84e7-46e1-9e64-f61678fbfd06';
const ONESIGNAL_REST_API_KEY = 'os_v2_app_tdlrlcue45dodhte6ylhr675a3zl264dujru6uufev5ftvm2mjpmcv2nyqcl7ldwrgpq4czykeyr4bbtx22auykndrmaqpear54if6a';

// ⚠️ IMPORTANTE: Cambia esta URL por la de tu sitio en Vercel
const SITE_URL  = 'https://tiendacristianaleondejuda.vercel.app';  // <-- REEMPLAZA CON TU URL DE VERCEL
const ICONO_URL = SITE_URL + '/assets/icons/icon-192x192.png';

const ONESIGNAL_CONFIGURADO = true; // Ya tienes APP ID configurada

// ── Inicializar OneSignal ────────────────────────────────────────
if (ONESIGNAL_CONFIGURADO) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  OneSignalDeferred.push(async function(OneSignal) {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: '/OneSignalSDKWorker.js',  // ← Importante: ruta correcta
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

      // Etiquetar al admin cuando inicie sesión
      try {
        const user = await getUsuario?.();
        if (user && user.email === 'admin@leondejuda.com') { // Reemplaza con tu email admin
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
    btn.style.color        = '#7c8090';
    btn.style.borderColor  = 'rgba(255,255,255,.12)';
    btn.style.background   = 'rgba(255,255,255,.05)';
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

  try {
    const resultado = await Notification.requestPermission();

    if (resultado === 'granted') {
      // Suscribir en OneSignal
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          try { 
            await OneSignal.Notifications.requestPermission(); 
            console.log('[OneSignal] Permiso concedido');
            
            const user = await getUsuario?.();
            if (user && user.email === 'tiendacristianaleondejuda@gmail.com') { // Reemplaza con tu email admin
              await OneSignal.User.addTag('rol', 'admin');
              await OneSignal.User.addTag('email', user.email);
            }
          } catch(e) {
            console.warn('[OneSignal] Error en suscripción:', e);
          }
        });
      }
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
  await _enviarPushAdmin(
    '🛍️ Nuevo pedido',
    '🛍️ Nuevo pedido',
    `Pedido #${pedidoId.substring(0,8).toUpperCase()} · ${total}`,
    `Pedido #${pedidoId.substring(0,8).toUpperCase()} · ${total}`
  );
}

// ── Enviar push para mensaje nuevo ───────────────────────────────
async function notificarMensajeAdmin(nombre, preview) {
  if (!ONESIGNAL_CONFIGURADO) return;
  await _enviarPushAdmin(
    `💬 Mensaje de ${nombre}`,
    `💬 Mensaje de ${nombre}`,
    `"${preview}"`,
    `"${preview}"`
  );
}

// ── Helper interno para enviar push ─────────────────────────────
async function _enviarPushAdmin(headingEn, headingEs, bodyEn, bodyEs) {
  const esClaveV2 = ONESIGNAL_REST_API_KEY.startsWith('os_v2_');
  
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': esClaveV2
          ? `Key ${ONESIGNAL_REST_API_KEY}`
          : `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [{ field: 'tag', key: 'rol', relation: '=', value: 'admin' }],
        headings: { en: headingEn, es: headingEs },
        contents: { en: bodyEn, es: bodyEs },
        url: SITE_URL + 'pages/admin/panel.html',
        chrome_web_icon: ICONO_URL,
        firefox_icon: ICONO_URL,
        large_icon: ICONO_URL,
        small_icon: ICONO_URL,
        priority: 10,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.errors && data.errors[0]?.includes('No subscribers')) {
        console.info('[OneSignal] Admin aún no activó las notificaciones push.');
      } else {
        console.warn('[OneSignal] Error:', JSON.stringify(data.errors || data));
      }
    } else {
      console.info('[OneSignal] ✅ Push enviado:', data.id);
    }
  } catch(err) {
    console.warn('[OneSignal] No se pudo enviar push:', err.message);
  }
}
