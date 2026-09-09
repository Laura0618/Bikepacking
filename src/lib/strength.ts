// Catalogo de ejercicios de fuerza recomendados para cicloturismo con equipaje.

import type { StrengthExercise, StrengthExerciseId } from '../types';

export const STRENGTH_EXERCISES: Record<StrengthExerciseId, StrengthExercise> = {
  sentadilla: {
    id: 'sentadilla',
    nombre: 'Sentadilla al cajon',
    series: 3,
    repeticiones: '8-12',
    foco: 'Cuadriceps y gluteo',
    descripcion:
      'Baja controlada hasta rozar una silla o cajon y sube empujando con el talon. Sin peso o con mochila ligera.',
  },
  zancada: {
    id: 'zancada',
    nombre: 'Zancada estatica',
    series: 3,
    repeticiones: '8-10 por pierna',
    foco: 'Equilibrio y pierna unilateral',
    descripcion: 'Un pie delante y otro detras, baja la rodilla trasera hacia el suelo sin tocarlo.',
  },
  peso_muerto_rumano: {
    id: 'peso_muerto_rumano',
    nombre: 'Peso muerto rumano',
    series: 3,
    repeticiones: '8-12',
    foco: 'Isquios y espalda baja',
    descripcion:
      'Con mancuernas o mochila, lleva la cadera atras manteniendo la espalda recta y las rodillas casi rectas.',
  },
  puente_gluteo: {
    id: 'puente_gluteo',
    nombre: 'Puente de gluteo',
    series: 3,
    repeticiones: '12-15',
    foco: 'Gluteo y core posterior',
    descripcion: 'Tumbada boca arriba, eleva la cadera apretando el gluteo y baja despacio.',
  },
  plancha: {
    id: 'plancha',
    nombre: 'Plancha frontal',
    series: 3,
    repeticiones: '20-40 s',
    foco: 'Core anterior',
    descripcion: 'Antebrazos y puntas de los pies, cuerpo en linea recta, sin hundir la zona lumbar.',
  },
  plancha_lateral: {
    id: 'plancha_lateral',
    nombre: 'Plancha lateral',
    series: 2,
    repeticiones: '15-30 s por lado',
    foco: 'Oblicuos y estabilidad de cadera',
    descripcion: 'Apoya un antebrazo y el canto del pie, eleva la cadera y mantente estable.',
  },
  remo_banda: {
    id: 'remo_banda',
    nombre: 'Remo con banda elastica',
    series: 3,
    repeticiones: '12-15',
    foco: 'Espalda alta y postura',
    descripcion: 'Tira de la banda llevando los codos atras y juntando las escapulas; util para aguantar horas agachada.',
  },
  elevacion_talones: {
    id: 'elevacion_talones',
    nombre: 'Elevacion de talones',
    series: 3,
    repeticiones: '15-20',
    foco: 'Gemelo y tobillo',
    descripcion: 'De pie, sube sobre las puntas de los pies y baja despacio; opcional a una pierna.',
  },
  perro_pajaro: {
    id: 'perro_pajaro',
    nombre: 'Perro-pajaro',
    series: 3,
    repeticiones: '10 por lado',
    foco: 'Estabilidad lumbopelvica',
    descripcion: 'A cuatro patas, extiende brazo y pierna opuestos sin rotar la cadera.',
  },
  gato_camello: {
    id: 'gato_camello',
    nombre: 'Gato-camello',
    series: 2,
    repeticiones: '8-10',
    foco: 'Movilidad de columna',
    descripcion: 'Alterna redondear y arquear la espalda con respiracion lenta; bueno antes y despues de rodar.',
  },
};

export interface StrengthRoutine {
  id: string;
  titulo: string;
  duracion: string;
  descripcion: string;
  ejercicios: StrengthExerciseId[];
}

export const STRENGTH_ROUTINES: StrengthRoutine[] = [
  {
    id: 'base-20',
    titulo: 'Rutina base (20-25 min)',
    duracion: '20-25 min',
    descripcion:
      'Dos veces por semana en los meses 1 a 3. Circuito comodo, sin llegar al fallo, con 60-90 s de descanso.',
    ejercicios: [
      'gato_camello',
      'sentadilla',
      'puente_gluteo',
      'peso_muerto_rumano',
      'plancha',
      'perro_pajaro',
    ],
  },
  {
    id: 'carga-25',
    titulo: 'Rutina de carga (25-30 min)',
    duracion: '25-30 min',
    descripcion:
      'Meses 4 y 5, una o dos veces por semana. Anade trabajo unilateral y de espalda para tolerar el equipaje.',
    ejercicios: [
      'sentadilla',
      'zancada',
      'peso_muerto_rumano',
      'remo_banda',
      'plancha_lateral',
      'elevacion_talones',
    ],
  },
  {
    id: 'mantenimiento-15',
    titulo: 'Mantenimiento (10-15 min)',
    duracion: '10-15 min',
    descripcion:
      'Mes 6 y semanas de descarga. Solo activacion suave, sin fatiga. Nada intenso los ultimos dias antes del viaje.',
    ejercicios: ['gato_camello', 'puente_gluteo', 'perro_pajaro', 'plancha'],
  },
];
