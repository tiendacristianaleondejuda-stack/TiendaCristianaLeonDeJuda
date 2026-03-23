// ================================================================
//  notificaciones.js — OneSignal + alertas de pedidos y mensajes
//  Versión: Sin prompts automáticos
// ================================================================

const ONESIGNAL_APP_ID       = '98d7158a-84e7-46e1-9e64-f61678fbfd06';
const ONESIGNAL_REST_API_KEY = 'os_v2_app_tdlrlcue45dodhte6ylhr675a3zl264dujru6uufev5ftvm2mjpmcv2nyqcl7ldwrgpq4czykeyr4bbtx22auykndrmaqpear54if6a';
const SITE_URL  = 'https://tiendacristianaleondejuda.vercel.app/';
const ICONO_URL = SITE_URL + 'assets/icons/icon-192x192.png';

let oneSignalCargado = false;
let oneSignalInicializado = false;

// Función para cargar OneSignal dinámicamente
function cargarOneSignal() {
  return new Promise((resolve, reject) => {
    if (window.OneSignal && oneSignalInicializado) {
      resolve(window.OneSignal);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        if (window.OneSignal) {
          resolve(window.OneSignal);
        } else {
          reject(new Error('OneSignal no disponible'));
        }
      }, 500);
    };
    script.onerror = () => reject(new Error('Error al cargar OneSignal'));
    document.head.appendChild(script);
  });
}

// Inicializar OneSignal sin ningún prompt automático
async function iniciarOneSignal() {
  if (oneSignalInicializado) return;
  
  try {
    const OneSignal = await cargarOneSignal();
    
    // Desactivar completamente los prompts automáticos
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      notifyButton: { enable: false },
      allowLocalhostAsSecureOrigin: true,
      promptOptions: {
        slidedown: {
          enabled: false,           // Desactivar slide down
          autoPrompt: false,        // No mostrar automáticamente
          customLink: {
            enabled: false,          // Desactivar link personalizado
          },
        },
        autoPrompt: false,           // No mostrar prompt automático
        actionMessage: false,        // No mostrar mensaje de acción
        acceptButton: false,         // No mostrar botón de aceptar
        cancelButton: false,         // No mostrar botón de cancelar
      },
      welcomeNotification: {
        disable: true,               // Desactivar notificación de bienvenida
      },
    });
    
    console.log('[OneSignal] Inicializado correctamente (sin prompts automáticos)');
    oneSignalInicializado = true;
    
    // Registrar admin si está logueado
    try {
      const user = await getUsuario?.();
      if (user && user.email === 'tiendacristianaleondejuda@gmail.com') {
        await OneSignal.User.addTag('rol', 'admin');
        await OneSignal.User.addTag('email', user.email);
        console.info('[OneSignal] ✅ Admin registrado');
      } else {
        console.log('[OneSignal] Usuario no es admin:', user?.email);
      }
    } catch(e) {
      console.warn('[OneSignal] Error al registrar admin:', e);
    }
    
    actualizarBotonNotif();
    
  } catch(err) {
    console.warn('[OneSignal] Error en init:', err.message);
    actualizarBotonNotif();
  }
}

// Iniciar cuando la página cargue
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarOneSignal);
} else {
  iniciarOneSignal();
}

function actualizarBotonNotif() {
  const btn = document.getElementById('btn-notif');
  const icon = document.getElementById('notif-icon');
  const label = document.getElementById('notif-label');
  if (!btn) return;

  const estado = Notification?.permission || 'default';

  if (estado === 'granted') {
    btn.style.color = '#4ade80';
    btn.style.borderColor = 'rgba(74,222,128,.35)';
    btn.style.background = 'rgba(74,222,128,.1)';
    if (icon) icon.className = 'bi bi-bell-fill';
    if (label) label.textContent = 'Alertas activas';
  } else if (estado === 'denied') {
    btn.style.color = '#f87171';
    btn.style.borderColor = 'rgba(248,113,113,.35)';
    btn.style.background = 'rgba(248,113,113,.1)';
    if (icon) icon.className = 'bi bi-bell-slash';
    if (label) label.textContent = 'Bloqueadas';
  } else {
    btn.style.color = '#7c8090';
    btn.style.borderColor = 'rgba(255,255,255,.12)';
    btn.style.background = 'rgba(255,255,255,.05)';
    if (icon) icon.className = 'bi bi-bell';
    if (label) label.textContent = 'Activar alertas';
  }
}

async function pedirPermisoNotificaciones() {
  const estado = Notification?.permission || 'default';

  if (estado === 'denied') {
    alert('⛔ Las notificaciones están BLOQUEADAS.\n\nPara activarlas:\n• Android Chrome: toca el candado 🔒 → Notificaciones → Permitir\n• PC Chrome: haz clic en el candado 🔒 → Notificaciones → Permitir\n\nDespués recargá la página.');
    return;
  }

  if (estado === 'granted') {
    alert('✅ Las alertas ya están activadas en este dispositivo.');
    return;
  }

  try {
    // Asegurar que OneSignal esté inicializado
    if (!oneSignalInicializado) {
      await iniciarOneSignal();
    }
    
    const resultado = await Notification.requestPermission();

    if (resultado === 'granted') {
      if (window.OneSignal) {
        await window.OneSignal.Notifications.requestPermission();
        console.log('[OneSignal] Permiso concedido');
        
        const user = await getUsuario?.();
        if (user && user.email === 'tiendacristianaleondejuda@gmail.com') {
          await window.OneSignal.User.addTag('rol', 'admin');
          await window.OneSignal.User.addTag('email', user.email);
        }
      }
      actualizarBotonNotif();
      alert('✅ ¡Alertas activadas! Recibirás notificaciones de pedidos y mensajes nuevos.');
    } else {
      console.log('[OneSignal] Usuario rechazó el permiso');
      actualizarBotonNotif();
    }
  } catch(err) {
    console.warn('[OneSignal] Error al pedir permiso:', err.message);
    alert('Error al activar notificaciones: ' + err.message);
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
  // No enviar si OneSignal no está inicializado
  if (!oneSignalInicializado) {
    console.log('[OneSignal] No inicializado, no se envía push');
    return;
  }
  
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
        priority: 10,
      }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      if (data.errors && data.errors[0]?.includes('No subscribers')) {
        console.info('[OneSignal] Admin aún no activó las notificaciones push.');
      } else {
        console.warn('[OneSignal] Error al enviar push:', JSON.stringify(data.errors || data));
      }
    } else {
      console.info('[OneSignal] ✅ Push enviado:', data.id);
    }
  } catch(err) {
    console.warn('[OneSignal] Error al enviar push:', err.message);
  }
}

// Función para verificar el estado (útil para debug)
async function verificarEstadoOneSignal() {
  if (!oneSignalInicializado) {
    console.log('OneSignal no inicializado');
    return;
  }
  
  const estado = Notification?.permission;
  console.log('Permiso de notificaciones:', estado);
  
  if (window.OneSignal) {
    const subscription = await window.OneSignal.User.getSubscription();
    console.log('Suscripción OneSignal:', subscription);
  }
}
