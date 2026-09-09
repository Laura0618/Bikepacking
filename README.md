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
