# Guía de Despliegue — Finanzas Pro-BI

## 1. Configurar Supabase (5 min)

1. Ir a https://supabase.com → **New project**
2. Anotar la URL y la `anon key` (Settings > API)
3. Ir a **SQL Editor** y pegar el contenido de `schema.sql` → **Run**
4. En Authentication > Settings activar **Email confirmations: OFF** (para desarrollo)

## 2. Variables de entorno locales

```bash
cp .env.example .env
# Editar .env con tus valores reales
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## 3. Desarrollo local

```bash
npm install
npm run dev
# App en http://localhost:5173
```

## 4. Despliegue en Vercel (gratis)

### Opción A — CLI (más rápido)

```bash
npm install -g vercel
vercel login
vercel --prod
# Sigue el wizard: Framework=Vite, Build=npm run build, Output=dist
```

### Opción B — GitHub (recomendado para CI/CD)

1. Subir el repo a GitHub: `git init && git add . && git commit -m "init" && git remote add origin <URL> && git push`
2. Ir a https://vercel.com → **New Project** → importar el repo
3. En **Environment Variables** agregar:
   - `VITE_SUPABASE_URL` → tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu anon key
4. Click **Deploy** → URL pública en ~60 segundos

## 5. PWA — Instalar en móvil

### Android (Chrome)
- Abrir la URL desplegada en Chrome
- Menú ⋮ → **"Agregar a pantalla de inicio"**

### iOS (Safari)
- Abrir la URL en Safari
- Compartir □↑ → **"Agregar a pantalla de inicio"**

## 6. Estructura final del proyecto

```
finanzas-pro-bi/
├── public/
│   └── icons/               # Iconos PWA (192x192, 512x512)
├── src/
│   ├── lib/
│   │   └── supabase.js      # Cliente Supabase + modo Demo
│   ├── context/
│   │   └── AppContext.jsx   # Estado global + CRUD
│   ├── utils/
│   │   ├── calculations.js  # Motor BI (stats, formato, charts)
│   │   └── aiEngine.js      # Agente IA financiero
│   ├── components/
│   │   ├── Auth/            # Login / Registro
│   │   ├── Layout/          # Sidebar desktop + BottomNav mobile
│   │   ├── Dashboard/       # KPIs + gráficas + presupuestos
│   │   ├── Movements/       # Formulario + listado de movimientos
│   │   ├── Calendar/        # Vista mensual con totales diarios
│   │   ├── Goals/           # Metas de ahorro + presupuestos
│   │   └── AIAgent/         # Chat con el agente IA
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── schema.sql               # Schema Supabase listo para ejecutar
├── .env.example             # Plantilla de variables
├── vite.config.js           # Build + PWA plugin
├── tailwind.config.js
└── package.json
```

## 7. Iconos PWA (opcional)

Genera los iconos con https://realfavicongenerator.net o usa cualquier imagen cuadrada:

```bash
# Con ImageMagick
magick tu-logo.png -resize 192x192 public/icons/icon-192.png
magick tu-logo.png -resize 512x512 public/icons/icon-512.png
```

Sin iconos la PWA funciona igual, solo usará el ícono por defecto del navegador.
