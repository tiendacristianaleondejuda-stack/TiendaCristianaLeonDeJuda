// ================================================================
//  CONFIGURACIÓN DE SUPABASE — León de Judá TIENDA
// ================================================================
//  ⚠️  Reemplazá los valores de abajo con los tuyos.
//  Los encontrás en: supabase.com → Tu proyecto → Settings → API
// ================================================================

const SUPABASE_URL      = 'https://tprgnfikrfwqnndotgio.supabase.co';   // ← Cambiá esto
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwcmduZmlrcmZ3cW5uZG90Z2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTA0ODksImV4cCI6MjA4OTYyNjQ4OX0.bBcfyoWNLO3OT4NFMoPggPlLPMGPNe2uKvJg40SQd0Y';           // ← Cambiá esto

// ── Cuenta administradora ────────────────────────────────────────
const ADMIN_EMAIL = 'tiendacristianaleondejuda@gmail.com';

// ── Inicialización ───────────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Verificar si el usuario actual es admin ──────────────────────
async function esAdmin() {
  const user = await getUsuario();
  return user && user.email === ADMIN_EMAIL;
}

async function protegerAdmin() {
  const admin = await esAdmin();
  if (!admin) { window.location.href = '/index.html'; return false; }
  return true;
}

// ── Carrito en localStorage ──────────────────────────────────────
const Carrito = {
  get()    { return JSON.parse(localStorage.getItem('narvaez_carrito') || '{"items":[]}'); },
  save(c)  { localStorage.setItem('narvaez_carrito', JSON.stringify(c)); Carrito.actualizarContador(); },
  agregar(producto, talla, cantidad = 1) {
    const carrito = Carrito.get();
    const clave   = producto.id + '_' + talla;
    const existe  = carrito.items.find(i => i.clave === clave);
    if (existe) { existe.cantidad += cantidad; }
    else { carrito.items.push({ clave, id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen_url, talla, cantidad }); }
    Carrito.save(carrito);
  },
  eliminar(clave)  { const c = Carrito.get(); c.items = c.items.filter(i => i.clave !== clave); Carrito.save(c); },
  actualizarCantidad(clave, qty) { const c = Carrito.get(); const i = c.items.find(x => x.clave === clave); if (i) i.cantidad = qty; Carrito.save(c); },
  total()    { return Carrito.get().items.reduce((s, i) => s + i.precio * i.cantidad, 0); },
  cantidad() { return Carrito.get().items.reduce((s, i) => s + i.cantidad, 0); },
  vaciar()   { Carrito.save({ items: [] }); },
  actualizarContador() {
    const t = Carrito.cantidad();
    document.querySelectorAll('.carrito-badge').forEach(b => { b.textContent = t; b.style.display = t > 0 ? 'flex' : 'none'; });
  },
};

// ── Auth helpers ─────────────────────────────────────────────────
async function getUsuario() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function cerrarSesion() {
  await sb.auth.signOut();
  window.location.href = '/index.html';
}

async function actualizarNavbarAuth() {
  const user = await getUsuario();
  const linkLogin  = document.getElementById('nav-login');
  const linkCuenta = document.getElementById('nav-cuenta');
  if (!linkLogin || !linkCuenta) return;
  if (user) { linkLogin.style.display = 'none'; linkCuenta.style.display = 'flex'; }
  else       { linkLogin.style.display = 'flex'; linkCuenta.style.display = 'none'; }
}

function formatearPrecio(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
}
