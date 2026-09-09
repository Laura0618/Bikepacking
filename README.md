# Pedalea a Polonia

Aplicación web para planificar y seguir, durante seis meses, la preparación de un
viaje en bicicleta de varios días con equipaje.

El objetivo no es la velocidad ni el rendimiento competitivo, sino **consistencia,
confort, recuperación y tolerancia a la carga**: pasar de pedalear hoy 45–60 min sin
dolor a aguantar varios días seguidos de 2–3 h con la bici cargada.

## Características

- **Inicio / Hoy** (`/`): próximo entrenamiento, progreso semanal, racha de días,
  carga actual y alertas de recuperación.
- **Plan** (`/plan`): plan de seis meses (24 semanas) con detalle semanal, semanas de
  descarga y afinamiento, e hito objetivo de cada mes.
- **Calendario** (`/calendario`): vista semanal y mensual, con reprogramación de
  entrenamientos.
- **Registro** (`/registro`): formulario de registro de salidas. La **duración** es la
  métrica principal; distancia y velocidad son secundarias y opcionales.
- **Progreso** (`/progreso`): gráficas de horas semanales, salida más larga, carga de
  equipaje y días consecutivos, más los hitos automáticos.
- **Fuerza** (`/fuerza`): rutinas y ejercicios recomendados y registro de sesiones.
- **Ajustes** (`/ajustes`): fechas, días preferidos, unidades, regeneración del plan,
  exportación/importación JSON y reinicio de datos con confirmación.

### Hitos automáticos

90 min cómodos · 2 h seguidas · fin de semana consecutivo · 3 h con equipaje ·
bloque de 3 días · simulación de 4 días.

### Alertas de seguridad

- Dolor ≥ 5/10: recomienda parar, descansar y consultar a un profesional si persiste.
- No subir duración y carga de equipaje a la vez.
- Aviso de recuperación tras 6 días seguidos sin descanso.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- Recharts
- PWA instalable y preparada para funcionar offline (`vite-plugin-pwa`)
- Persistencia en `localStorage` (sin backend, sin autenticación, sin APIs externas)
- Vitest para tests unitarios

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Instalación local

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

Al abrirla por primera vez se genera automáticamente el plan de seis meses a partir
de la fecha actual. Puedes cambiar la fecha de inicio y regenerarlo desde **Ajustes**.

## Scripts

| Script            | Descripción                                              |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con recarga en caliente.        |
| `npm run build`   | Comprobación de tipos (`tsc -b`) y build de producción en `dist/`. |
| `npm run preview` | Sirve localmente el build de `dist/`.                  |
| `npm run lint`    | ESLint sobre todo el proyecto (0 warnings permitidos). |
| `npm run test`    | Tests unitarios con Vitest (una pasada).               |
| `npm run test:watch` | Tests en modo watch.                               |

## Estructura del proyecto

```
public/                 Recursos estáticos, iconos PWA, _redirects y _headers
src/
  components/            Componentes reutilizables de UI
    ui/                  Card, Badge, StatTile, EmptyState, AlertBanner, ...
    charts/              Gráficas con Recharts
  lib/                   Lógica pura y testeable
    dates.ts             Utilidades de fecha sin dependencias
    planTemplates.ts     Datos del plan obligatorio de seis meses
    plan.ts              Generación del plan y semanas de descarga
    calculations.ts      Horas semanales, salida larga, carga, rachas, series
    milestones.ts        Detección automática de hitos
    alerts.ts            Alertas de dolor, progresión y recuperación
    strength.ts          Catálogo de ejercicios y rutinas de fuerza
    storage.ts           Persistencia y (de)serialización JSON en localStorage
    selectors.ts         Selectores derivados para las vistas
    labels.ts            Etiquetas en español para los enums
  store/
    appData.ts           Reducer del estado global (sin React)
    AppDataProvider.tsx  Contexto de React + hook useAppData
  pages/                 Una página por ruta
  test/                  Configuración y factorías de test
```

### Modelo de datos

`UserSettings`, `Workout`, `PlanMonth`, `StrengthSession`, `Milestone` y `AppData`
están definidos con tipos estrictos en [`src/types/index.ts`](src/types/index.ts).
No se usa `any` en el proyecto. Las fechas se guardan como cadenas ISO `YYYY-MM-DD`.

Todo se persiste en `localStorage` bajo la clave `pedalea-a-polonia:v1`.

## Tests

```bash
npm run test
```

Cubren, entre otros:

- cálculo de horas semanales (planificadas y realizadas),
- detección de hitos,
- semanas de descarga y factor de reducción,
- alerta de dolor y alerta de progresión brusca,
- exportación/importación JSON.

## PWA y uso offline

`vite-plugin-pwa` genera el `manifest` y un service worker con `autoUpdate` que
precachea la aplicación. Tras el primer `npm run build` + `npm run preview` (o el
primer despliegue) la app es **instalable** y funciona sin conexión. Como no hay
backend ni APIs externas, toda la funcionalidad está disponible offline.

## Despliegue en Cloudflare Pages (gratis)

### Opción A — desde el panel de Cloudflare (Git)

1. Sube este repositorio a GitHub/GitLab.
2. En el panel de Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
3. Selecciona el repositorio y configura:
   - **Framework preset:** `None` (o `Vite`).
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** define la variable de entorno `NODE_VERSION` = `20`
     (pestaña *Settings → Environment variables*).
4. **Save and Deploy**.

El archivo [`public/_redirects`](public/_redirects) con la regla
`/*  /index.html  200` ya está incluido para que el enrutado de React Router
funcione en recargas y rutas profundas. [`public/_headers`](public/_headers)
ajusta el cacheo del service worker y de los assets.

### Opción B — con Wrangler (CLI)

```bash
npm install --global wrangler
npm run build
wrangler pages deploy dist --project-name pedalea-a-polonia
```

La configuración base para Pages está en [`wrangler.toml`](wrangler.toml).

## Descargo

Esta aplicación es una herramienta de organización, no un consejo médico ni de
entrenamiento personalizado. Ante dolor persistente o dudas de salud, consulta a un
profesional.
