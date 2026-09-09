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

- **Node.js 22 o superior** (lo exige `wrangler` 4.x; fijado en `.node-version` y en
  `package.json` → `engines`). El entorno de build de Cloudflare también debe usar 22
  (ver *Despliegue con autenticación*).
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

- **Sin sesión:** todo en `localStorage`, como antes. No se llama a `/api/sync`, no hay
  errores en bucle; el chip de la cabecera dice *Inicia sesión*.
- **Al iniciar sesión:** se descarga el estado de la cuenta (`GET /api/sync`). Si la
  cuenta está vacía y hay datos locales, un diálogo pregunta si **copiarlos a la cuenta**
  o **empezar la cuenta vacía** (sin duplicados: el `id` de cada fila es la clave).
- **En uso normal:** cada cambio local se sube con *debounce* de 1,5 s
  (`POST /api/sync`, solo filas modificadas). El **registro de una salida nunca se
  bloquea por un fallo de red**: se guarda en local y se reintenta. Indicador en la
  cabecera y en Ajustes: *Sincronizado / Guardando… / Pendiente de sincronizar / Sin
  conexión / Error / Inicia sesión*.
- **Sin red:** se sigue registrando y editando en local; al volver la conexión (`online`)
  se reintenta el envío.
- **Conflictos:** *gana el más reciente* por `updatedAt` (`resolveRow` / `incomingWins`,
  aisladas para poder cambiar la política más adelante).
- **Aislamiento:** el `userId` se extrae **solo** de la cookie de sesión firmada; toda
  consulta a D1 lleva `WHERE user_id = ?1` con ese id. Un payload no puede seleccionar a
  otra usuaria.

### Endurecimiento de seguridad aplicado

- **`Cache-Control: no-store`** en todas las respuestas `/api/*` (`worker/http.ts` +
  `withNoStore` en `worker/index.ts`).
- **Comprobación de mismo origen** (`isSameOrigin`, vía `Sec-Fetch-Site` y, en su
  defecto, `Origin`/`Referer` contra `APP_URL`) en `POST /api/sync` y
  `POST /api/auth/logout` → `403 bad_origin` si no coincide. **No hay CORS abierto**: el
  Worker no emite `Access-Control-Allow-Origin`.
- **Rate limiting** en `/api/auth/login` (10/min/IP), `/api/auth/callback` (20/min/IP) y
  **`/api/sync`** (120/min por usuaria) → `429 rate_limited`. El limitador está detrás de
  la interfaz `RateLimiter` (`worker/ratelimit.ts`); la implementación por defecto es en
  memoria por *isolate* y se puede sustituir por KV/Durable Object sin tocar las llamadas.
- **Validación estricta de payloads** (`worker/validate.ts`): `workoutType`, `intensity`,
  `status` y `milestone.id` se restringen a los valores de dominio de
  [`src/lib/domain.ts`](src/lib/domain.ts); rangos numéricos, formato de fechas
  (`YYYY-MM-DD` vs ISO datetime), tamaño (≤ 20 KB/fila, ≤ 5000 filas) e ids duplicados.
  Cuerpo inválido → `400 bad_payload` con mensaje claro.
- **Sesión:** cookie `pp_session` firmada HMAC-SHA256 con `SESSION_SECRET`, `HttpOnly`,
  `Secure` (en https), `SameSite=Lax`, 30 días. El estado anti-CSRF de OAuth (`pp_oauth`)
  se valida en el callback.
- **Secretos:** `GOOGLE_CLIENT_SECRET` y `SESSION_SECRET` se leen **solo** de `env` del
  Worker; nunca están en `wrangler.toml`, el frontend ni archivos versionados.
  [`.dev.vars`](.dev.vars.example) (valores locales) está en `.gitignore`.

## Despliegue con autenticación

> ⚠️ **Rotación de secretos.** Si en algún momento un *client secret* de Google (formato
> `GOCSPX-…`) apareció en `wrangler.toml`, en un commit, en un log o en cualquier archivo
> versionado, **debe considerarse comprometido**: entra en Google Cloud Console →
> *Credenciales* → tu ID de cliente OAuth → **restablecer / rotar el secreto** y vuelve a
> configurar el nuevo con `wrangler secret put`. El *Client ID* no es secreto y puede
> quedar en `wrangler.toml`.

Checklist manual (no requiere ningún despliegue automático):

1. **Node 22 en el build de Cloudflare.** `wrangler` 4.x exige Node ≥ 22.
   - Local: `.node-version` ya es `22`.
   - Panel de Cloudflare → Worker → **Settings → Build → Variables**: si existe una
     variable `NODE_VERSION`, ponla a `22` (o bórrala para que mande `.node-version`).
     Con Node 20 el paso *Deploying* falla con
     *"Wrangler requires at least Node.js v22.0.0"*.

2. **Crear D1 y migrar en remoto.**
   ```bash
   npx wrangler login
   npx wrangler d1 create pedalea_a_polonia
   # pega el database_id devuelto en wrangler.toml -> [[d1_databases]].database_id
   npx wrangler d1 migrations apply pedalea_a_polonia --remote
   ```

3. **Secretos del Worker** (no van en ningún archivo):
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_SECRET   # el GOCSPX-… de Google
   openssl rand -base64 48                         # copia el resultado
   npx wrangler secret put SESSION_SECRET          # pega ese resultado
   ```
   (o panel → *Settings → Variables and Secrets → Add → Secret / Encrypt*).
   Guarda `SESSION_SECRET`: si cambia, se cierran todas las sesiones.

4. **`APP_URL` y `GOOGLE_CLIENT_ID`** en `[vars]` de [`wrangler.toml`](wrangler.toml)
   (o como *Variables* de texto en el panel):
   - `APP_URL = "https://bikepacking.castrolaura0311.workers.dev"` (URL pública real,
     **sin barra final**).
   - `GOOGLE_CLIENT_ID = "…apps.googleusercontent.com"` (el que lleva números al
     principio; **no** el `GOCSPX-…`).

5. **Callback de Google OAuth.** En Google Cloud Console → *Credenciales* → tu ID de
   cliente OAuth:
   - *URIs de redirección autorizados*:
     `https://bikepacking.castrolaura0311.workers.dev/api/auth/callback`
     (y `http://localhost:5173/api/auth/callback` para desarrollo).
   - *Orígenes autorizados de JavaScript*:
     `https://bikepacking.castrolaura0311.workers.dev`
     (y `http://localhost:5173` para desarrollo).
   - Pantalla de consentimiento tipo *Externo*; con tu correo como usuario de prueba basta.

6. **Desplegar y verificar.**
   ```bash
   npm run deploy          # = npm run build && wrangler deploy
   ```
   - `GET https://…/api/config` → `{"oauthConfigured":true}`.
   - Abre la web → **Ajustes → Entrar con Google** → vuelve a `…/ajustes?login=ok`.
   - `GET https://…/api/me` (con sesión) → `{"user":{…}}`.
   - Registra una salida en el móvil, abre la web en el ordenador con la misma cuenta y
     comprueba que aparece (y al revés). El chip debe pasar por *Guardando…* →
     *Sincronizado*.

Si faltan `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `SESSION_SECRET`, la app se
publica igual y funciona en **modo local**: Ajustes muestra "inicio de sesión no
configurado" y `/api/auth/login` responde `503` (no hay login falso).

### Despliegue continuo (Git)

Cloudflare → **Workers & Pages → Create → Workers → Import a repository** → repo
`Laura0618/Bikepacking`. Build command `npm run build`, deploy command
`npx wrangler deploy`. Cada `git push` a `main` redespliega. Recuerda el punto 1
(NODE_VERSION = 22).

## Tests

```bash
npm run lint && npm run test && npm run build
```

Además de la lógica de entrenamiento (horas semanales, hitos, descargas, alertas,
export/import), cubren:

- **`syncEngine`**: merge LWW, tombstones remotas/locales, migración inicial forzada.
- **Sesión** (`worker/__tests__/session.test.ts`): firma ida/vuelta, firma manipulada,
  secreto distinto, token caducado.
- **Validación** (`worker/__tests__/validate.test.ts`): enums fuera de dominio,
  `milestone.id` inexistente, fechas mal formadas, rangos, ids duplicados, tamaño → `400`.
- **API del Worker** (`worker/__tests__/api.test.ts`): `POST /api/sync` sin sesión →
  `401`; desde origen ajeno → `403`; `Cache-Control: no-store` en las respuestas;
  payload con enum inválido → `400`; rate limit de `/api/sync` → `429`; toda lectura
  filtra por el `uid` de la cookie.
- **Aislamiento** (`worker/__tests__/authorization.test.ts`): cada consulta de
  `getSnapshot`/`applyPush` incluye `user_id` y liga el uid como primer parámetro.
- **Dominio** (`src/lib/__tests__/domain.test.ts`): los arrays de valores válidos
  coinciden con las etiquetas y los hitos.

## PWA y uso offline

`vite-plugin-pwa` genera el `manifest` y un service worker (`autoUpdate`) que precachea
la app. `/api/*` queda fuera del precacheo y del fallback SPA (`NetworkOnly` +
`navigateFallbackDenylist`). Tras el primer `npm run build` + `preview` (o el primer
despliegue) la app es **instalable** y funciona sin conexión; con cuenta, los cambios
hechos offline se sincronizan al reconectar.

## Descargo

Esta aplicación es una herramienta de organización, no un consejo médico ni de
entrenamiento personalizado. Ante dolor persistente o dudas de salud, consulta a un
profesional.
