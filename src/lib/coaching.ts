// Textos de acompanamiento: nota de ritmo, motivo de la sesion de hoy,
// version corta, observacion tras registrar y estado de preparacion.
// Tono de companera de ruta prudente: directo, sereno, especifico y no culpabilizador.

import type { AppData, Intensity, Milestone, Workout } from '../types';
import { addDays } from './dates';
import { collectAlerts } from './alerts';
import { isDeloadWeek, isTaperWeek } from './plan';

export function intensityCue(intensity: Intensity): string {
  switch (intensity) {
    case 'muy_suave':
      return 'Muy tranquilo, deberias poder cantar.';
    case 'suave':
      return 'Ritmo conversacional: puedes hablar sin cortarte.';
    case 'moderado':
      return 'Comodo-exigente: frases cortas al hablar.';
    case 'exigente':
      return 'Respiracion alta, pero sin llegar al limite.';
    default:
      return '';
  }
}

function isDone(w: Workout): boolean {
  return w.status === 'completed' || w.status === 'partial';
}

function minutesOf(w: Workout): number {
  if (w.actualDurationMinutes !== null && w.actualDurationMinutes !== undefined) {
    return w.actualDurationMinutes;
  }
  return w.status === 'completed' ? w.plannedDurationMinutes : 0;
}

/** Motivo comprensible de por que toca esta sesion hoy. */
export function sessionRationale(workout: Workout, workouts: Workout[]): string {
  if (workout.planWeek !== undefined && isDeloadWeek(workout.planWeek)) {
    return 'Semana de recuperacion: mantener el volumen bajo consolida la adaptacion de las semanas previas.';
  }
  if (workout.planWeek !== undefined && isTaperWeek(workout.planWeek)) {
    return 'Semana de afinamiento: llegas fresca al viaje, nada de sesiones largas ni intensas.';
  }

  const prevDay = addDays(workout.date, -1);
  const restedYesterday = workouts.some(
    (w) => w.date === prevDay && (w.workoutType === 'descanso' || w.status === 'skipped'),
  );
  if (restedYesterday && (workout.workoutType === 'suave' || workout.workoutType === 'recuperacion')) {
    return 'Vienes de descanso: hoy toca rodar facil para volver a la rutina sin cargarte.';
  }

  const nextWeekLong = workouts.some(
    (w) =>
      w.date > workout.date &&
      w.date <= addDays(workout.date, 5) &&
      (w.workoutType === 'salida_larga' || w.workoutType === 'cargada' || w.workoutType === 'simulacion'),
  );
  if (nextWeekLong && workout.workoutType !== 'salida_larga' && workout.workoutType !== 'simulacion') {
    return 'Sesion de apoyo: guarda piernas, la salida larga de los proximos dias es la clave de la semana.';
  }

  const lastDone = workouts
    .filter(isDone)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (lastDone && workout.loadKg > lastDone.loadKg && workout.loadKg > 0) {
    return `Subes el equipaje a ${workout.loadKg} kg: la duracion se mantiene para observar manos, espalda y estabilidad.`;
  }

  switch (workout.workoutType) {
    case 'salida_larga':
      return 'Salida larga de la semana: el objetivo es acabar comoda, no rapida.';
    case 'simulacion':
      return 'Dia de simulacion: practica como si ya estuvieras de viaje, con el equipaje real.';
    case 'cargada':
      return 'Salida con equipaje: fijate en el confort de contacto tanto como en las piernas.';
    case 'moderado':
      return 'Toque de intensidad controlada dentro de una semana mayormente suave.';
    case 'descanso':
      return 'Descanso: es parte del plan y cuenta como sesion cumplida.';
    default:
      return 'Sesion facil para sumar constancia. Terminar comoda ya es un exito.';
  }
}

/** Duracion sugerida para una version corta cuando hay poco tiempo (30-40 min). */
export function shortVersionMinutes(workout: Workout): number {
  if (workout.plannedDurationMinutes <= 45) return workout.plannedDurationMinutes;
  return 35;
}

/** Observacion util devuelta despues de registrar una salida. */
export function postLogObservation(saved: Workout, workouts: Workout[]): string {
  if (saved.status === 'skipped') {
    return 'Sesion marcada como no realizada. Puedes moverla dentro de la semana o seguir con la siguiente; no hace falta compensar.';
  }
  if (saved.workoutType === 'descanso') {
    return 'Descanso registrado. Recuperar tambien te prepara para el viaje.';
  }

  const minutes = minutesOf(saved);
  const doneRides = workouts
    .filter((w) => isDone(w) && w.workoutType !== 'descanso')
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const previousLongest = doneRides
    .filter((w) => w.id !== saved.id)
    .reduce((max, w) => Math.max(max, minutesOf(w)), 0);

  const parts: string[] = [];
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  parts.push(`Registraste ${h > 0 ? `${h} h ` : ''}${m} min.`);

  if (minutes > previousLongest && previousLongest > 0) {
    parts.push('Es tu salida mas larga hasta ahora.');
  }

  if (saved.painLevel !== undefined && saved.painLevel >= 5) {
    parts.push(
      'Registraste dolor alto: no subas carga ni duracion hasta que mejore y consulta a un profesional si sigue varios dias.',
    );
  } else if (saved.painLevel !== undefined && saved.painLevel >= 3) {
    parts.push('Molestia moderada: repite duracion antes de subirla y vigila si vuelve a aparecer.');
  } else if (saved.loadKg > 0) {
    parts.push(
      `Llevaste ${saved.loadKg} kg con buenas sensaciones; el plan puede mantener la progresion prevista.`,
    );
  } else {
    parts.push('Buenas sensaciones: continua con el plan tal cual.');
  }

  return parts.join(' ');
}

/** Texto de impacto tras mover una salida a una nueva fecha. */
export function rescheduleImpact(
  workouts: Workout[],
  moved: Workout,
  newDateISO: string,
): string {
  const others = workouts.filter((w) => w.id !== moved.id && w.workoutType !== 'descanso');
  const dayHas = (iso: string): Workout | undefined => others.find((w) => w.date === iso);

  // Cuenta dias consecutivos con salida alrededor de la nueva fecha.
  let streak = 1;
  let cursor = addDays(newDateISO, -1);
  while (dayHas(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  cursor = addDays(newDateISO, 1);
  while (dayHas(cursor)) {
    streak += 1;
    cursor = addDays(cursor, 1);
  }

  const isLong =
    moved.workoutType === 'salida_larga' ||
    moved.workoutType === 'cargada' ||
    moved.workoutType === 'simulacion';

  const parts: string[] = [];
  if (streak >= 2) {
    parts.push(`Quedan ${streak} dias seguidos con salida alrededor de esa fecha.`);
  }
  const nextDay = dayHas(addDays(newDateISO, 1));
  if (isLong && nextDay && nextDay.intensity === 'moderado') {
    parts.push('Ojo: cae justo antes de un dia moderado; considera dejar un dia facil en medio.');
  }
  if (streak >= 3) {
    parts.push('Tres o mas dias seguidos es carga alta: asegurate de que puedes recuperar.');
  }
  if (parts.length === 0) {
    parts.push('Sin solapes: la semana mantiene su reparto de dias.');
  }
  return parts.join(' ');
}

export type PreparacionNivel = 'empezando' | 'en_camino' | 'casi_listo' | 'listo' | 'precaucion';

export interface PreparacionEstado {
  nivel: PreparacionNivel;
  titulo: string;
  siguientePaso: string;
  condiciones: { label: string; cumplida: boolean }[];
}

const MILESTONE_NEXT_STEP: Record<string, string> = {
  noventa_min: 'Completa una salida de 90 min terminando comoda.',
  dos_horas: 'Suma una salida de 2 h seguidas a ritmo facil.',
  finde_consecutivo: 'Haz un sabado y un domingo seguidos con salida en ambos.',
  tres_horas_cargada: 'Completa una salida de 3 h con 7-8 kg de equipaje.',
  bloque_tres_dias: 'Encadena tres dias con salida y observa como recuperas.',
  simulacion_cuatro_dias: 'Haz la simulacion de cuatro dias con el equipaje definitivo.',
};

export function preparationStatus(data: AppData, refISO: string): PreparacionEstado {
  const alerts = collectAlerts(data.workouts, refISO);
  const hayDolor = alerts.some((a) => a.id.startsWith('pain-'));

  const condiciones = data.milestones.map((m: Milestone) => ({
    label: m.label,
    cumplida: m.achievedAt !== null,
  }));
  const pendientes = data.milestones.filter((m) => !m.achievedAt);
  const logrados = data.milestones.length - pendientes.length;

  const siguientePaso =
    pendientes.length > 0
      ? (MILESTONE_NEXT_STEP[pendientes[0]?.id ?? ''] ?? 'Repasa los hitos pendientes.')
      : 'Revisa la comodidad de la simulacion y descansa antes del viaje.';

  if (hayDolor) {
    return {
      nivel: 'precaucion',
      titulo: 'Prioriza la recuperacion',
      siguientePaso:
        'Registraste dolor de 5/10 o mas. Descansa, no subas carga ni duracion y consulta a un profesional si persiste.',
      condiciones,
    };
  }

  if (logrados === 0) {
    return { nivel: 'empezando', titulo: 'Estas empezando', siguientePaso, condiciones };
  }
  if (logrados >= data.milestones.length) {
    return {
      nivel: 'listo',
      titulo: 'Preparacion completa',
      siguientePaso,
      condiciones,
    };
  }
  if (logrados >= data.milestones.length - 1) {
    return { nivel: 'casi_listo', titulo: 'Casi listo', siguientePaso, condiciones };
  }
  return { nivel: 'en_camino', titulo: 'Vas en camino', siguientePaso, condiciones };
}
