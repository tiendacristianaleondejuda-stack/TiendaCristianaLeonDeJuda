# 🔔 Guía de Notificaciones Push — OneSignal

> Con esto vas a recibir una alerta en tu celular Android **cada vez que entre un pedido nuevo**, incluso con la app cerrada.

---

## PASO 1 — Crear cuenta en OneSignal

1. Entrá a **https://onesignal.com** y hacé clic en **"Sign up for free"**.
2. Registrate con tu correo (el de la tienda está bien).
3. Una vez adentro, hacé clic en **"New App / Website"**.
4. Poné como nombre: `Leon de Juda` (o el nombre de tu tienda).
5. Elegí la plataforma **"Web"** y hacé clic en **"Next: Configure Your Platform"**.

---

## PASO 2 — Configurar la plataforma Web

En la pantalla de configuración:

1. **Choose Integration**: seleccioná **"Typical Site"**.

2. Completá los campos:
   - **Site Name**: `León de Judá`
   - **Site URL**: la URL donde subiste tu tienda.  
     Ejemplos:
     - Si usás Netlify: `https://leon-de-juda.netlify.app`
     - Si usás Vercel:  `https://leon-de-juda.vercel.app`
     - Si todavía estás local: `http://localhost:8000` (solo para probar)
   - **Default Icon URL**: dejalo vacío por ahora o pegá la URL de tu logo.

3. Hacé clic en **"Save"**.

4. En la siguiente pantalla te van a mostrar un **App ID** que se ve así:
   ```
   xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
   **Copialo, lo vas a necesitar.**

---

## PASO 3 — Obtener la REST API Key

1. En el menú de la izquierda de OneSignal, hacé clic en **Settings**.
2. Luego en **"Keys & IDs"**.
3. Ahí vas a ver:
   - **OneSignal App ID** — el mismo de antes
   - **Rest API Key** — una clave larga, copiala también

---

## PASO 4 — Pegar las claves en tu proyecto

Abrí el archivo **`cliente/js/notificaciones.js`** con el Bloc de notas y reemplazá:

```javascript
// Antes:
const ONESIGNAL_APP_ID = 'TU_APP_ID_DE_ONESIGNAL_AQUI';

// Después (ejemplo):
const ONESIGNAL_APP_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

Y también:
```javascript
// Antes:
const ONESIGNAL_REST_API_KEY = 'TU_REST_API_KEY_DE_ONESIGNAL_AQUI';

// Después (ejemplo):
const ONESIGNAL_REST_API_KEY = 'NjY2ZmM2OTEt...';
```

Y el link del panel admin:
```javascript
// Antes:
url: 'https://TU-DOMINIO.com/cliente/pages/admin/panel.html',

// Después (con tu dominio real):
url: 'https://leon-de-juda.netlify.app/cliente/pages/admin/panel.html',
```

Guardá el archivo.

---

## PASO 5 — Verificar que el archivo de Service Worker esté en su lugar

El archivo **`OneSignalSDKWorker.js`** ya está creado en la carpeta `cliente/`.

⚠️ **Importante**: este archivo DEBE estar en la misma carpeta que `index.html`. Si tu tienda está en `/cliente/`, el archivo debe estar en `/cliente/OneSignalSDKWorker.js`.

---

## PASO 6 — Subir la tienda a internet (necesario para las notificaciones)

Las notificaciones push **no funcionan en localhost**. Necesitás tener la tienda en una URL real con HTTPS. Las opciones más fáciles y gratuitas son:

### Opción A: Netlify (la más fácil)

1. Entrá a **https://netlify.com** y creá una cuenta gratis.
2. En tu panel, hacé clic en **"Add new site" → "Deploy manually"**.
3. Arrastrá toda la carpeta `cliente/` al área que dice "Drag and drop".
4. En segundos te da una URL como `https://nombre-aleatorio.netlify.app`.
5. Esa URL es la que usás en OneSignal y en `notificaciones.js`.

### Opción B: Vercel

1. Entrá a **https://vercel.com** y creá cuenta.
2. Instalá Vercel CLI o subí directamente desde la web.

---

## PASO 7 — Activar las alertas en tu celular

1. Abrí la tienda desde tu celular Android con Chrome.
2. Instalá la PWA (va a aparecer el banner de instalación).
3. Abrí la app instalada.
4. **Ingresá con tu cuenta de administrador** (`tiendacristianaleondejuda@gmail.com`).
5. En el panel de administrador, tocá el botón **"🔔 Alertas"** en la barra superior.
6. El celular te va a preguntar si permitís las notificaciones → tocá **"Permitir"**.

A partir de ese momento, cada vez que un cliente confirme un pedido, vas a recibir una notificación en tu celular aunque la app esté cerrada.

---

## PASO 8 — Probar que funciona

1. Abrí la tienda desde otro celular o en modo incógnito.
2. Agregá un producto al carrito y confirmá el pedido.
3. En pocos segundos deberías ver la notificación en tu celular.

---

## ❓ Preguntas frecuentes

**¿Funciona en iPhone?**  
Las notificaciones push en iOS requieren iOS 16.4+ con Safari. El proceso es el mismo: instalar la PWA desde Safari y luego activar las notificaciones.

**¿Cuántas notificaciones puedo enviar gratis?**  
El plan gratuito de OneSignal permite **10.000 notificaciones por mes**, más que suficiente para una tienda.

**¿La notificación llega aunque el celular esté bloqueado?**  
Sí, siempre que el celular tenga conexión a internet y las notificaciones estén activadas para la app.

**¿Puedo personalizar el ícono de la notificación?**  
Sí, en `notificaciones.js` hay una línea `chrome_web_icon` donde podés poner la URL de tu logo.

**¿Qué pasa si el cliente no tiene internet cuando compra?**  
La notificación se envía al servidor de OneSignal al confirmar el pedido. Si tu celular no tiene internet en ese momento, la recibirás cuando vuelva a conectarse.

---

## 📁 Archivos relacionados

| Archivo | Descripción |
|---------|-------------|
| `cliente/OneSignalSDKWorker.js` | Service Worker de OneSignal (no modificar) |
| `cliente/js/notificaciones.js` | Configuración y funciones de notificaciones |
| `cliente/pages/tienda/carrito.html` | Llama a `notificarNuevoPedido()` al confirmar |
| `cliente/pages/admin/panel.html` | Botón "🔔 Alertas" para activar permisos |

---

**Versión**: 1.0  
**Actualizado**: 2025  
**Servicio**: OneSignal (gratuito hasta 10.000 notif/mes)
