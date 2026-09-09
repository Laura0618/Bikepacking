# Pedalea a Polonia

Aplicación web para planificar y seguir, durante seis meses, la preparación de un
viaje en bicicleta de varios días con equipaje.

El objetivo no es la velocidad ni el rendimiento competitivo, sino **consistencia,
confort, recuperación y tolerancia a la carga**: pasar de pedalear hoy 45–60 min sin
dolor a aguantar varios días seguidos de 2–3 h con la bici cargada.

## Características

Navegación inferior de 5 destinos (**Hoy · Plan · Calendario · Progreso · Más**) y un
botón persistente **Registrar salida** visible desde cualquier pantalla.

- **Inicio / Hoy** (`/`): tarjeta "¿Qué hago hoy?" con duración, nota de ritmo y
  **por qué** toca esa sesión, más acciones de baja fricción (marcar hecha, versión
  corta de 30–40 min, mover, cambiar por descanso). Progreso semanal, racha, carga
  actual y alertas de recuperación.
- **Plan** (`/plan`): plan de seis meses (24 semanas) con detalle semanal, semanas de
  descarga y afinamiento explicadas, e hito objetivo de cada mes.
- **Calendario** (`/calendario`): vista semanal y mensual. Estados con marca textual
  además del color, leyenda, reprogramación con **previsualización de impacto** y
  **deshacer**.
- **Registro** (`/registro`): pensado para menos de 30 s. Primero el estado con botones
  grandes, luego la **duración** (control ±5 min) como métrica principal, y sensaciones
  con escalas verbales de esfuerzo y dolor (anclajes 0/3/5/7/10). Distancia y velocidad
  quedan plegadas como secundarias. Tras guardar, devuelve una observación útil.
- **Progreso** (`/progreso`): **estado de preparación** con condiciones concretas
  ("te falta una salida de 3 h con carga"), no una puntuación opaca. Gráficas de horas
  semanales, salida más larga, carga de equipaje y días consecutivos, cada una con su
  tabla de datos accesible. Hitos automáticos. Muestra "sin registro" en vez de 0.
- **Más** (`/mas`): acceso a Fuerza (`/fuerza`), Registro y Ajustes (`/ajustes`), guía
  de uso y privacidad.
- **Ajustes** (`/ajustes`): fechas, días preferidos, unidades, regeneración del plan,
  exportación/importación JSON y reinicio de datos con confirmación.

### Decisiones de UX y diseño aplicadas

El producto sigue [`mejores_practicas_ux_pedalea_a_polonia.md`](mejores_practicas_ux_pedalea_a_polonia.md)
y [`guia_diseno_pedalea_a_polonia.md`](guia_diseno_pedalea_a_polonia.md):

- El tiempo domina sobre km/velocidad; descansar es acción completa, no fallo.
- Plan adaptable con límites visibles (no subir duración y carga a la vez, no compensar
  las semanas de descarga).
- En **Hoy**, "Registrar al volver" abre un **panel de registro rápido** (~15 s:
  duración, dolor, esfuerzo, nota) en vez de marcar hecho sin sensaciones; toda acción
  tiene **Deshacer** durante 10 s. La métrica se llama "Días activos seguidos", no
  "racha", con recordatorio de que los descansos previstos protegen el plan.
- **Plan** con cabecera "Mes X de 6", mes actual resaltado y auto-expandido, meses
  pasados marcados; el resto plegado.
- **Progreso**: sin datos muestra un único siguiente paso, no cuatro gráficas vacías;
  cada gráfica lleva una frase de lectura y tabla accesible; la carga usa escala fija a
  9 kg (objetivo del viaje).
- Tokens de color semánticos: verde bosque (acción), azul (recuperación), ámbar
  (`caution`, progresión brusca) y rojo (`danger`, dolor ≥ 5/10 e irreversibles),
  siempre con texto/icono además del color. Se respeta `prefers-reduced-motion`.

### Hitos automáticos

90 min cómodos · 2 h seguidas · fin de semana consecutivo · 3 h con equipaje ·
bloque de 3 días · simulación de 4 días.

### Alertas de seguridad

- Dolor ≥ 5/10: recomienda parar, descansar y consultar a un profesional si persiste.
- No subir duración y carga de equipaje a la vez.
- Aviso de recuperación tras 6 días seguidos sin descanso.

## Stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, React Router, Recharts.
- **PWA** instalable y offline (`vite-plugin-pwa`).
- **Persistencia local:** `localStorage` (clave `pedalea-a-polonia:v1`), que además hace
  de caché offline cuando hay cuenta.
- **Backend opcional (Fase 1 de persistencia):** un único **Cloudflare Worker** que
  sirve la PWA y expone la API en `/api/*`, con **Cloudflare D1** (SQLite) como base de
  datos y **Google OAuth** para la cuenta. Sin cuenta, la app funciona igual, solo en
  local.
- **Tests:** Vitest.

Sin `any` en todo el proyecto; tipos estrictos en [`src/types/index.ts`](src/types/index.ts).

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Instalación local

### Solo frontend (sin cuenta)

```bash
npm install
npm run dev            # http://localhost:5173
```

Al abrirla por primera vez se genera el plan de seis meses desde la fecha actual.
Cámbiala y regenéralo en **Ajustes**.

### Con API + base de datos (cuenta y sincronización)

Necesitas dos procesos. En una terminal el frontend, en otra el Worker:

```bash
# 1. Prepara la base D1 local y aplica migraciones
npx wrangler d1 create pedalea_a_polonia      # pega el database_id en wrangler.toml
npm run db:migrate:local

# 2. Copia las variables locales y rellénalas (ver .dev.vars.example)
cp .dev.vars.example .dev.vars

# 3. Arranca API (Worker) y frontend
npm run dev:api        # wrangler dev -> http://localhost:8787
npm run dev            # Vite :5173, con /api proxied a :8787
```

En dev, `APP_URL` en [`wrangler.toml`](wrangler.toml) debe ser `http://localhost:5173`
y `GOOGLE_CLIENT_ID` tu client id de pruebas.

## Scripts

| Script                 | Descripción                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | Frontend con recarga en caliente (Vite).                     |
| `npm run dev:api`      | API local: `wrangler dev` (Worker + D1 local + `.dev.vars`). |
| `npm run build`        | `tsc -b` (frontend + worker) y build de producción en `dist/`. |
| `npm run preview`      | Sirve el build de `dist/`.                                   |
| `npm run lint`         | ESLint (0 warnings).                                         |
| `npm run typecheck`    | Solo comprobación de tipos.                                  |
| `npm run test`         | Tests unitarios con Vitest.                                  |
| `npm run db:migrate:local` | Aplica `migrations/` a la D1 local.                      |
| `npm run db:migrate`   | Aplica `migrations/` a la D1 remota.                         |
| `npm run deploy`       | `build` + `wrangler deploy`.                                 |

## Estructura del proyecto

```
public/                 Recursos estáticos, iconos PWA y _headers
migrations/              Migraciones SQL de Cloudflare D1
  0001_init.sql
worker/                  Backend (Cloudflare Worker)
  index.ts               Router: sirve ASSETS y la API /api/*
  google.ts              Google OAuth (code flow)
  session.ts             Cookie de sesión firmada (HMAC)
  db.ts                  Acceso a D1, parametrizado y por user_id
  validate.ts            Validación de payloads
  ratelimit.ts           Rate limiting básico de /api/auth/*
  __tests__/             Tests de sesión, validación y aislamiento
src/
  components/            Componentes de UI (ui/, charts/, Sync*, Migrar*)
  lib/
    plan.ts / planTemplates.ts   Plan obligatorio de seis meses
    calculations.ts / milestones.ts / alerts.ts / coaching.ts
    storage.ts            Persistencia local + migración v1→v2
    api.ts               Cliente de /api/*
    syncEngine.ts        Merge de sincronización (LWW, puro y testeable)
  store/
    appData.ts           Reducer (sin React); sella updatedAt, crea tombstones
    AppDataProvider.tsx  Contexto + orquestación de auth y sincronización
  pages/                 Una página por ruta
  test/                  Configuración y factorías
```

### Modelo de datos

Tipos estrictos en [`src/types/index.ts`](src/types/index.ts). Entidades
sincronizables (`Workout`, `StrengthSession`, `Milestone`, `UserSettings`) llevan
`updatedAt` (ISO datetime) y `deletedAt`; los borrados se registran como `tombstones`
en `AppData`. Las fechas de calendario siguen siendo `YYYY-MM-DD`.

En D1 (ver [`migrations/0001_init.sql`](migrations/0001_init.sql)): `users`,
`user_settings`, `workouts`, `strength_sessions`, `milestones`, `sync_metadata`. Cada
fila pertenece a un `user_id` (PK compuesta `(user_id, id)`, índice por
`(user_id, updated_at)`). El objeto completo se guarda como JSON en `data` y además
se materializan `updated_at` / `deleted_at` para resolver conflictos e indexar.

## Cuenta y sincronización (Fase 1 de persistencia)

### Decisión de arquitectura: Worker, no Pages Functions

El repo se despliega como **Worker con Static Assets** (`wrangler deploy`), no como
Pages. Por eso la API vive en el **mismo Worker** ([`worker/index.ts`](worker/index.ts)):
`run_worker_first = ["/api/*"]` en [`wrangler.toml`](wrangler.toml) hace que `/api/*`
pase por el código antes que el fallback SPA de los assets; el resto de rutas las sirve
`env.ASSETS`. Un solo despliegue, una sola config, el binding de D1 en un único sitio.

### Cómo funciona

- **Sin sesión:** todo en `localStorage`, como antes.
- **Al iniciar sesión:** se descarga el estado de la cuenta (`GET /api/sync`). Si la
  cuenta está vacía y hay datos locales, un diálogo pregunta si **copiarlos a la cuenta**
  o **empezar la cuenta vacía** (sin duplicados: el `id` de cada fila es la clave).
- **En uso normal:** cada cambio local se sube con *debounce* de 1,5 s
  (`POST /api/sync`, solo filas modificadas). Estado visible en la cabecera y en Ajustes:
  *Sincronizado / Guardando… / Pendiente / Sin conexión / Error*.
- **Sin red:** se sigue registrando y editando en local; al volver la conexión se
  reintenta el envío automáticamente.
- **Conflictos:** *gana el más reciente* por `updatedAt` (`resolveRow` / `incomingWins`,
  aisladas para poder cambiar la política más adelante).
- **Sesión:** cookie `pp_session` firmada con HMAC-SHA256 (`SESSION_SECRET`), `HttpOnly`,
  `Secure` (en https), `SameSite=Lax`, 30 días. El logout borra la cookie; los datos
  locales se conservan. La exportación JSON sigue disponible como copia de seguridad.

### Variables y secretos

| Nombre                 | Dónde                          | Qué es |
| ---------------------- | ------------------------------ | ------ |
| `APP_URL`              | `wrangler.toml` `[vars]` / panel | URL pública sin barra final. Dev: `http://localhost:5173`. |
| `GOOGLE_CLIENT_ID`     | `wrangler.toml` `[vars]` / panel | Client ID de Google OAuth (no es secreto). |
| `GOOGLE_CLIENT_SECRET` | `.dev.vars` (local) / `wrangler secret` (prod) | Client secret de Google. |
| `SESSION_SECRET`       | `.dev.vars` (local) / `wrangler secret` (prod) | Cadena aleatoria larga (`openssl rand -base64 48`). |

Nunca se guardan secretos en el repo. [`.dev.vars`](.dev.vars.example) está en
`.gitignore`.

### Pasos manuales para activar la cuenta

**1. Google Cloud Console** — https://console.cloud.google.com/apis/credentials

1. *Crear credenciales → ID de cliente de OAuth → Aplicación web*.
2. *Orígenes autorizados de JavaScript*:
   `http://localhost:5173` y `https://TU-DOMINIO` (el de tu Worker o dominio propio).
3. *URIs de redirección autorizados*:
   `http://localhost:5173/api/auth/callback` y `https://TU-DOMINIO/api/auth/callback`.
4. Copia el **Client ID** y el **Client secret**. Configura la *pantalla de
   consentimiento* (tipo Externo; con tu correo como usuario de prueba basta).

**2. Cloudflare D1**

```bash
npx wrangler login
npx wrangler d1 create pedalea_a_polonia
# pega el database_id que devuelve en wrangler.toml -> [[d1_databases]].database_id
npx wrangler d1 migrations apply pedalea_a_polonia --remote
```

**3. Variables y secretos del Worker**

- En [`wrangler.toml`](wrangler.toml) pon `APP_URL` = URL pública real y
  `GOOGLE_CLIENT_ID` = tu client id. (O ponlos como *Variables* en el panel de
  Cloudflare → tu Worker → *Settings → Variables*.)
- Secretos:
  ```bash
  npx wrangler secret put GOOGLE_CLIENT_SECRET
  npx wrangler secret put SESSION_SECRET
  ```
  (o en el panel: *Settings → Variables → Add → Encrypt*).

**4. Desplegar** (ver abajo). Si falta `GOOGLE_CLIENT_ID`/`SECRET`/`SESSION_SECRET`,
la app sigue funcionando en modo local y Ajustes muestra "inicio de sesión no
configurado"; el endpoint `/api/auth/login` responde `503` en vez de simular un login.

## Tests

```bash
npm run test
```

Cubren, entre otros: horas semanales, detección de hitos, semanas de descarga, alertas
de dolor y de progresión brusca, export/import JSON, **merge de sincronización**
(LWW, tombstones, migración inicial), **firma/caducidad de sesión**, **validación de
payloads** y **aislamiento por `user_id`**.

## PWA y uso offline

`vite-plugin-pwa` genera el `manifest` y un service worker (`autoUpdate`) que precachea
la app. `/api/*` queda fuera del precacheo y del fallback SPA (estrategia `NetworkOnly`).
Tras el primer `npm run build` + `preview` (o el primer despliegue) la app es
**instalable** y funciona sin conexión; con cuenta, los cambios hechos offline se
sincronizan al reconectar.

## Despliegue en Cloudflare (gratis)

Se despliega como **Worker con Static Assets** (no Pages). Config en
[`wrangler.toml`](wrangler.toml): `main`, `[assets]` (`binding`, `not_found_handling`,
`run_worker_first`), `[[d1_databases]]` y `[vars]`.

### Desde el panel (Git)

1. `git push` del repo a GitHub.
2. Cloudflare → **Workers & Pages → Create → Workers → Import a repository** → elige el
   repo.
3. Ajustes de build:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - Node 20 (se toma de `.node-version`).
4. Antes o después del primer deploy, completa los **pasos manuales** de arriba
   (D1 + migraciones + variables + secretos).
5. Cada `git push` a `main` redespliega.

### Con Wrangler (CLI)

```bash
npm run build
npx wrangler deploy
```

## Descargo

Esta aplicación es una herramienta de organización, no un consejo médico ni de
entrenamiento personalizado. Ante dolor persistente o dudas de salud, consulta a un
profesional.
