# 🛍️ Guía de Configuración — Narvaez Tienda Online

> **Leé esto de principio a fin antes de tocar cualquier archivo.**  
> Seguí cada paso en orden. No se necesitan conocimientos de programación.

---

## PASO 1 — Crear tu cuenta en Supabase (gratis)

1. Abrí **https://supabase.com** en tu navegador.
2. Hacé clic en **"Start your project"** o **"Sign up"**.
3. Registrate con tu cuenta de GitHub o con tu correo.
4. Una vez adentro, hacé clic en **"New project"**.
5. Completá:
   - **Name**: `narvaez-tienda` (o el nombre que quieras)
   - **Database Password**: inventate una contraseña segura (guardala)
   - **Region**: elige la más cercana, por ejemplo `South America (São Paulo)`
6. Hacé clic en **"Create new project"** y esperá ~2 minutos mientras se configura.

---

## PASO 2 — Obtener tus claves de API

1. Dentro de tu proyecto, en el menú de la izquierda hacé clic en **Settings** (ícono de engranaje).
2. Luego clic en **API**.
3. Vas a ver dos valores importantes:
   - **Project URL** → se ve así: `https://abcdefgh.supabase.co`
   - **anon public** (debajo de "Project API keys") → una clave larga

4. Abrí el archivo **`cliente/js/supabase-config.js`** con cualquier editor de texto (por ej. el Bloc de notas).
5. Reemplazá estas dos líneas con tus valores reales:

```javascript
const SUPABASE_URL      = 'https://TU_PROYECTO.supabase.co';   // ← pegá tu Project URL
const SUPABASE_ANON_KEY = 'TU_CLAVE_ANON_KEY_AQUI';           // ← pegá tu anon public key
```

**Ejemplo de cómo quedaría:**
```javascript
const SUPABASE_URL      = 'https://xyzabc1234.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

Guardá el archivo.

---

## PASO 3 — Crear las tablas en Supabase

1. En el menú de la izquierda de Supabase, hacé clic en **SQL Editor**.
2. Hacé clic en **"New query"**.
3. Copiá y pegá el siguiente código SQL **completo** en el editor:

```sql
-- ============================================================
-- TABLA: productos
-- ============================================================
CREATE TABLE IF NOT EXISTS productos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  precio          DECIMAL(10,2) NOT NULL,
  precio_original DECIMAL(10,2),         -- precio tachado (para mostrar oferta)
  imagen_url      TEXT,                  -- URL de la imagen principal
  imagenes_urls   TEXT[],                -- URLs de imágenes adicionales (opcional)
  categoria       TEXT,                  -- ej: remeras, pantalones, vestidos...
  tallas          TEXT[],                -- ej: {"XS","S","M","L","XL"}
  stock           INTEGER DEFAULT 0,
  activo          BOOLEAN DEFAULT TRUE,   -- si está visible en la tienda
  destacado       BOOLEAN DEFAULT FALSE,  -- aparece con badge "Destacado"
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: perfiles (datos extra del usuario)
-- ============================================================
CREATE TABLE IF NOT EXISTS perfiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nombre      TEXT,
  apellido    TEXT,
  telefono    TEXT,
  direccion   TEXT,
  ciudad      TEXT,
  pais        TEXT DEFAULT 'Argentina',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: pedidos
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  estado          TEXT DEFAULT 'pendiente',  -- pendiente / confirmado / enviado / entregado / cancelado
  total           DECIMAL(10,2),
  direccion_envio JSONB,                     -- guarda dirección, teléfono, notas
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: pedido_items (los productos de cada pedido)
-- ============================================================
CREATE TABLE IF NOT EXISTS pedido_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     UUID REFERENCES productos(id) ON DELETE SET NULL,
  cantidad        INTEGER NOT NULL DEFAULT 1,
  talla           TEXT,
  precio_unitario DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- PERMISOS (Row Level Security)
-- Permite que los usuarios solo vean y editen sus propios datos
-- ============================================================

-- Productos: todos pueden ver (es una tienda pública)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Productos visibles para todos"
  ON productos FOR SELECT USING (activo = TRUE);

-- Solo admins pueden insertar/editar productos (hacerlo desde Supabase Dashboard)
CREATE POLICY "Solo service_role modifica productos"
  ON productos FOR ALL USING (auth.role() = 'service_role');

-- Perfiles: cada usuario ve y edita solo el suyo
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Perfil propio: leer"
  ON perfiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Perfil propio: insertar"
  ON perfiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Perfil propio: actualizar"
  ON perfiles FOR UPDATE USING (auth.uid() = user_id);

-- Pedidos: cada usuario ve sus pedidos
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pedidos propios: leer"
  ON pedidos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Pedidos propios: insertar"
  ON pedidos FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pedido items: accesibles si son de un pedido propio
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items de pedidos propios"
  ON pedido_items FOR ALL USING (
    pedido_id IN (SELECT id FROM pedidos WHERE user_id = auth.uid())
  );
```

4. Hacé clic en **"Run"** (botón verde).
5. Deberías ver el mensaje **"Success. No rows returned"** — eso significa que funcionó ✅

---

## PASO 4 — Agregar productos a la tienda

Tenés dos formas de cargar productos:

### Opción A: Desde el panel de Supabase (más fácil)

1. En el menú izquierdo, hacé clic en **Table Editor**.
2. Seleccioná la tabla **`productos`**.
3. Hacé clic en **"Insert" → "Insert row"**.
4. Completá los campos:
   - `nombre`: Remera Básica Blanca
   - `descripcion`: Remera de algodón 100%, corte recto.
   - `precio`: 4500
   - `precio_original`: 5500  ← (solo si querés mostrar precio tachado)
   - `imagen_url`: pegá la URL de una imagen (podés subir imágenes a Supabase Storage o usar cualquier link)
   - `categoria`: remeras
   - `tallas`: `{"XS","S","M","L","XL"}`  ← así se escribe un array
   - `activo`: `true`
   - `destacado`: `true` o `false`
5. Hacé clic en **"Save"**.

### Opción B: Con SQL (para cargar varios de una vez)

Hacé clic en **SQL Editor → New query** y pegá algo así:

```sql
INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria, tallas, activo, destacado)
VALUES
  ('Remera Básica Blanca', 'Remera de algodón 100%, corte recto.', 4500, 'https://tu-imagen.com/remera.jpg', 'remeras', '{"XS","S","M","L","XL"}', true, true),
  ('Jean Skinny Azul',     'Jean de corte skinny, tiro medio.',    8900, 'https://tu-imagen.com/jean.jpg',   'pantalones', '{"38","40","42","44"}', true, false),
  ('Vestido Floral',       'Vestido con estampado floral.',         6200, 'https://tu-imagen.com/vestido.jpg', 'vestidos', '{"S","M","L"}', true, true);
```

---

## PASO 5 — Subir imágenes (opcional pero recomendado)

Para subir tus propias fotos de productos:

1. En Supabase, menú izquierdo → **Storage**.
2. Hacé clic en **"New bucket"**.
3. Nombre: `productos`, y marcá **"Public bucket"** ✅
4. Hacé clic en **"Create bucket"**.
5. Dentro del bucket, hacé clic en **"Upload file"** y subí tus fotos.
6. Luego hacé clic derecho sobre la imagen → **"Get URL"** → copiá esa URL y usala en el campo `imagen_url`.

---

## PASO 6 — Configurar autenticación de usuarios

1. En Supabase, menú izquierdo → **Authentication → Providers**.
2. Asegurate de que **Email** esté activado ✅.
3. (Opcional) Si querés que los usuarios puedan registrarse sin confirmar el correo:
   - Ir a **Authentication → Settings**.
   - Desactivar la opción **"Enable email confirmations"**.
   - Esto es más cómodo para probar, pero en producción se recomienda dejarla activada.

---

## PASO 7 — Probar la tienda localmente

Para ver tu tienda en el navegador necesitás un servidor local (es un paso técnico pero muy simple):

### Con Python (la forma más fácil):

1. Abrí la consola/terminal en Windows:  
   Presioná `Win + R`, escribí `cmd`, presioná Enter.
2. Navegá a la carpeta del proyecto, por ejemplo:
   ```
   cd C:\Users\TuNombre\Downloads\Narvaez
   ```
3. Ejecutá:
   ```
   python -m http.server 8000
   ```
4. Abrí tu navegador en: **http://localhost:8000/cliente/index.html**

### Con VS Code:
1. Instalá la extensión **"Live Server"**.
2. Hacé clic derecho en `index.html` → **"Open with Live Server"**.

---

## 📁 Archivos que se crearon/modificaron

| Archivo | ¿Qué hace? |
|---------|-----------|
| `cliente/index.html` | **NUEVO**: La tienda principal con grilla de productos |
| `cliente/login.html` | **NUEVO**: Login y registro de clientes |
| `cliente/js/supabase-config.js` | **NUEVO**: Configuración de Supabase (ponés tus claves acá) |
| `cliente/pages/tienda/producto.html` | **NUEVO**: Vista de detalle de cada producto |
| `cliente/pages/tienda/carrito.html` | **NUEVO**: Carrito de compras |
| `cliente/pages/tienda/cuenta.html` | **NUEVO**: Mi cuenta y historial de pedidos |

---

## 🔧 Personalización rápida

### Cambiar el nombre de la tienda
Buscá y reemplazá **"Narvaez"** en todos los archivos HTML por el nombre de tu tienda.

### Cambiar los colores
En cada archivo HTML hay una sección `:root { }` al principio del CSS. Cambiá:
- `--accent: #b07d4a` → el color dorado/caramelo de los botones y badges
- `--text: #0f0f0f` → el color principal (negro)

### Cambiar las categorías
En `index.html`, buscá `<div class="categorias-wrap">` y editá los botones de categoría con los nombres que necesites.

---

## ❓ Preguntas frecuentes

**¿Los productos no aparecen?**  
→ Verificá que la URL y la clave en `supabase-config.js` sean correctas.  
→ Verificá que los productos tengan `activo = true` en la base de datos.

**¿El login dice "Invalid login credentials"?**  
→ Si configuraste confirmación de email, el usuario debe confirmar su correo primero.

**¿Cómo manejo los pedidos?**  
→ Los pedidos se guardan en la tabla `pedidos` de Supabase. Podés verlos y editarlos desde el **Table Editor** de Supabase. También podés cambiar el `estado` del pedido desde ahí.

**¿Puedo agregar Google como método de login?**  
→ Sí, en Supabase → Authentication → Providers → Google. Pero requiere crear una app en Google Cloud Console.

---

**Versión**: 2.0.0 — Tienda Online  
**Actualizado**: 2025  
**Licencia**: Privada — Narvaez © 2025
