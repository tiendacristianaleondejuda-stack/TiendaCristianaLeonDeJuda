// ================================================================
//  notificaciones.js — OneSignal (VERSIÓN CORREGIDA)
// ================================================================

const ONESIGNAL_APP_ID = '98d7158a-84e7-46e1-9e64-f61678fbfd06';
const SITE_URL         = 'https://tiendacristianaleondejuda.vercel.app';
const ICONO_URL        = SITE_URL + '/assets/icons/icon-192x192.png';
const ADMIN_EMAIL      = 'tiendacristianaleondejuda@gmail.com'; // 🔴 CAMBIA ESTO por el email del admin

// ── Inicializar OneSignal ────────────────────────────────────────
window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal) {
  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      // 🔴 ELIMINADO: serviceWorkerParam: { scope: '/' },
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

    // Esperar a que el Service Worker esté listo
    await OneSignal.Notifications.addEventListener('permissionChange', () => {});
    
    // Etiquetar al usuario según su rol
    try {
      // 🔴 Usar window.getUsuario si existe, sino esperar
      const getUsuarioFn = window.getUsuario || (() => null);
      const user = await getUsuarioFn();
      
      if (user && user.id) {
        await OneSignal.User.addTag('user_id', user.id);

        if (user.email === ADMIN_EMAIL) {
          await OneSignal.User.addTag('rol', 'admin');
          await OneSignal.User.addTag('email', user.email);
          console.info('[OneSignal] ✅ Admin registrado');
        } else if (user.email) {
          await OneSignal.User.addTag('rol', 'cliente');
          console.info('[OneSignal] ✅ Cliente registrado:', user.id.substring(0,8));
        }
      } else {
        console.info('[OneSignal] Usuario no logueado, esperando...');
      }
    } catch(e) {
      console.warn('[OneSignal] Error al etiquetar usuario:', e.message);
    }

    actualizarBotonNotif();

  } catch(err) {
    console.warn('[OneSignal] Error en init:', err.message);
    actualizarBotonNotif();
  }
});

// ── Estado del botón (sin cambios) ───────────────────────────────
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

// ── Pedir permiso (corregido) ────────────────────────────────────
async function pedirPermisoNotificaciones() {
  const estado = Notification?.permission || 'default';
  if (estado === 'denied') {
    alert('⛔ Las notificaciones están BLOQUEADAS.\n\nPara activarlas:\n• Android Chrome: tocá el candado 🔒 en la barra → Notificaciones → Permitir\n• PC Chrome: hacé clic en el candado 🔒 → Notificaciones → Permitir\n\nDespués recargá la página.');
    return;
  }
  if (estado === 'granted') { 
    alert('✅ Las alertas ya están activadas en este dispositivo.'); 
    return; 
  }
  
  try {
    const resultado = await Notification.requestPermission();
    if (resultado === 'granted') {
      // 🔴 Usar la instancia ya inicializada
      if (window.OneSignal) {
        try { 
          await window.OneSignal.Notifications.requestPermission(); 
        } catch(e) {}
        
        const getUsuarioFn = window.getUsuario || (() => null);
        const user = await getUsuarioFn();
        if (user && user.id) {
          await window.OneSignal.User.addTag('user_id', user.id);
          if (user.email === ADMIN_EMAIL) {
            await window.OneSignal.User.addTag('rol', 'admin');
            await window.OneSignal.User.addTag('email', user.email);
          }
        }
      }
      actualizarBotonNotif();
      alert('✅ ¡Alertas activadas!');
    } else {
      actualizarBotonNotif();
    }
  } catch(e) { 
    console.warn('Error al pedir permiso:', e.message); 
  }
}

// ── Enviar push via Edge Function ────────────────────────────────
// 🔴 Asegurar que las variables de Supabase existan
const SUPABASE_URL = window.SUPABASE_URL || '';  // Debe definirse en otro archivo
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || ''; // Debe definirse en otro archivo

async function _enviarPush(tipo, payload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Push] Supabase no configurado');
    return;
  }
  
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

async function notificarMensajeAdmin(nombre, preview, pedidoId) {
  await _enviarPush('mensaje', { nombre, preview, pedidoId });
}

async function notificarEnvioCliente(pedidoId, numeroGuia, correo, userId) {
  await _enviarPush('envio', { pedidoId, numeroGuia, correo, userId });
}
