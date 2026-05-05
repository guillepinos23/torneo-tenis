# 🎾 Open Clase — Torneo de Tenis

Torneo todos contra todos en tiempo real. Nuxt 3 + Supabase + Vercel.

---

## Stack

- **Nuxt 3** — Vue 3 con SSR/SPA
- **Supabase** — Base de datos + Realtime (gratis)
- **Vercel** — Deploy gratuito

---

## Setup paso a paso

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo (gratis)
2. Una vez creado, ve a **SQL Editor** y pega el contenido de `supabase-schema.sql`
3. Ejecuta el SQL — creará las tablas y activará Realtime

### 2. Obtener credenciales de Supabase

En tu proyecto Supabase: **Settings → API**

Copia:
- `Project URL` → será tu `SUPABASE_URL`
- `anon public` key → será tu `SUPABASE_ANON_KEY`

### 3. Instalar y configurar el proyecto

```bash
# Instalar dependencias
npm install

# Copiar el archivo de variables de entorno
cp .env.example .env
```

Edita `.env` con tus datos:

```env
SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ADMIN_PASSWORD=profe2025
```

### 4. Arrancar en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Deploy en Vercel

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Deploy
vercel
```

O conecta el repo en [vercel.com](https://vercel.com) y añade las variables de entorno:

| Variable | Valor |
|---|---|
| `SUPABASE_URL` | tu URL de Supabase |
| `SUPABASE_ANON_KEY` | tu anon key de Supabase |
| `ADMIN_PASSWORD` | la contraseña que quieras |

---

## Cómo funciona

### Fases del torneo

1. **Registro** — Cualquiera entra y escribe su nombre. Se ve en tiempo real para todos.
2. **Sorteo** — El admin lanza el sorteo. Va revelando jornada a jornada con animación. Todos lo ven en directo.
3. **Torneo** — Tabla de clasificación, partidos por jornada, perfiles de jugadores. Cualquiera puede anotar resultados.

### Acceso admin

En la pantalla de registro hay un pequeño enlace "Acceso admin" abajo. La contraseña está en `.env` como `ADMIN_PASSWORD`.

### Tiempo real

Usa **Supabase Realtime** con `postgres_changes`. Cuando alguien anota un resultado o el admin cambia la fase, todos los clientes conectados lo ven al instante sin recargar.

---

## Estructura del proyecto

```
torneo-tenis/
├── assets/css/main.css          # Estilos globales + animaciones
├── composables/
│   ├── useSupabase.ts           # Cliente Supabase singleton
│   ├── useTorneo.ts             # Toda la lógica del torneo + Realtime
│   ├── useAdmin.ts              # Estado de admin con contraseña
│   └── usePlayerColor.ts        # Colores de avatar por jugador
├── components/
│   ├── TAvatar.vue              # Avatar circular de jugador
│   ├── TStreak.vue              # Puntitos de racha W/L
│   ├── TPill.vue                # Badge/etiqueta
│   ├── TSyncDot.vue             # Indicador de sincronización
│   ├── TMatchRow.vue            # Fila de partido
│   ├── AdminGate.vue            # Modal de contraseña admin
│   ├── ResultModal.vue          # Modal para anotar resultado
│   └── PlayerProfile.vue        # Perfil completo de jugador
├── pages/index.vue              # Página principal (todas las fases)
├── app.vue                      # Root
├── nuxt.config.ts               # Config de Nuxt
├── supabase-schema.sql          # Schema SQL para copiar en Supabase
└── .env.example                 # Variables de entorno de ejemplo
```
