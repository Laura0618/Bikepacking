// Utilidades de fecha sin dependencias externas.
// Todas las fechas "ISO" son cadenas "YYYY-MM-DD" interpretadas en horario local.

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const parts = iso.split('-').map((p) => Number.parseInt(p, 10));
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function diffInDays(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO).getTime();
  const b = parseISODate(toISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Lunes de la semana que contiene la fecha dada. */
export function startOfWeek(iso: string): string {
  const date = parseISODate(iso);
  const day = date.getDay(); // 0 domingo
  const delta = day === 0 ? -6 : 1 - day;
  return addDays(iso, delta);
}

export function endOfWeek(iso: string): string {
  return addDays(startOfWeek(iso), 6);
}

export function isSameISOWeek(a: string, b: string): boolean {
  return startOfWeek(a) === startOfWeek(b);
}

export function startOfMonth(iso: string): string {
  const date = parseISODate(iso);
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonth(iso: string): string {
  const date = parseISODate(iso);
  return toISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function weekdayName(iso: string): string {
  return DIAS[parseISODate(iso).getDay()] ?? '';
}

export function weekdayShort(iso: string): string {
  return DIAS_CORTOS[parseISODate(iso).getDay()] ?? '';
}

export function monthName(monthIndex: number): string {
  return MESES[monthIndex] ?? '';
}

export function formatLongDate(iso: string): string {
  const date = parseISODate(iso);
  return `${weekdayName(iso)} ${date.getDate()} de ${monthName(date.getMonth())} de ${date.getFullYear()}`;
}

export function formatShortDate(iso: string): string {
  const date = parseISODate(iso);
  return `${date.getDate()} ${monthName(date.getMonth()).slice(0, 3)}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Devuelve la lista de lunes (ISO) entre dos fechas, inclusive. */
export function weekStartsBetween(fromISO: string, toISO: string): string[] {
  const result: string[] = [];
  let cursor = startOfWeek(fromISO);
  const end = startOfWeek(toISO);
  let guard = 0;
  while (cursor <= end && guard < 520) {
    result.push(cursor);
    cursor = addDays(cursor, 7);
    guard += 1;
  }
  return result;
}

export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(total));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}
