# Guia profunda de diseno - Pedalea a Polonia

> Documento de diseno de producto y de interfaz para una PWA personal de preparacion
> ciclista. Complementa la guia de UX: aqui se definen el lenguaje visual, la jerarquia,
> los componentes, los estados y los criterios con los que tomar decisiones.

## 1. Proposito y criterio rector

Pedalea a Polonia no es una app de rendimiento. Es una companera tranquila que ayuda a
llegar a una ruta de varios dias sana, segura y con confianza. La interfaz debe hacer
que el siguiente paso parezca manejable.

Cuatro ideas constantes:

1. Hoy basta con una cosa.
2. La constancia gana a la epica.
3. El cuerpo tiene la ultima palabra (dolor, fatiga y una salida parcial son datos, no un fallo moral).
4. El viaje es real y esta cada vez mas cerca.

Pregunta de control por pantalla: "esto ayuda a decidir, hacer o registrar algo con
serenidad?". Si no, se elimina, se oculta tras una accion secundaria o se mueve a
Progreso/Ajustes.

## 2. Lectura del estado actual

Se conserva: fondo marfil calido, superficies blancas, verde bosque como accion
principal, cuadricula 2x2 de metricas (max. 4 en Inicio), tarjetas de borde sutil y
radio generoso, FAB "Registrar salida" (oculto en Registro), copy que normaliza el
ritmo suave, datos secundarios opcionales (km/ritmo nunca como titular).

Hallazgos prioritarios ya aplicados o en curso:

- P0: `Mas` es una pantalla real con Fuerza, Registro y Ajustes.
- P0: "Hecho" abre un panel corto de ~15 s (duracion, dolor, esfuerzo, nota).
- P1: en Plan, un mes expandido (el actual), resto plegado, pasados marcados.
- P1: Progreso sin datos no dibuja graficas vacias, propone el primer paso.
- P1: Registro dividido en esenciales + sensaciones + "Anadir detalles".
- P2: emoji solo como detalle expresivo o estado vacio; navegacion con iconos consistentes.

## 3. Personalidad visual

### 3.1 Concepto: cuaderno de ruta sereno

Ni "fitness tracker" ni "aventura extrema". Preciso, humano, ligero y resistente.
Evitar gradientes electricos, medallas, llamas, fotos heroicas, mapas sin decision,
paneles oscuros, velocimetros y paletas de semaforo sin texto. Buscar ritmo, aire,
papel, cartografia discreta y mecanica limpia.

### 3.2 Paleta semantica (roles, no decoracion)

| Token | Valor | Uso |
| --- | --- | --- |
| surface.canvas | #F5F3EC | Fondo general. |
| surface.default | #FFFFFF | Tarjetas y formularios. |
| brand.primary | #2F5D3A | Accion primaria, navegacion activa. |
| brand.primary-strong | #1F3F28 | Hover, foco, texto de alto enfasis. |
| brand.primary-subtle | #E6EFE6 | Exito tranquilo, contexto de plan. |
| recovery.primary | #3D7FA6 | Descanso, recuperacion, carga con cautela. |
| recovery.subtle | #E2EEF4 | Tarjetas de racha/recuperacion. |
| caution.primary | #A65B19 | Atencion y revision (progresion brusca). |
| caution.subtle | #FBEEDD | Fondo de avisos preventivos. |
| danger.primary | #B42318 | Dolor alto, error de importacion, operaciones irreversibles. |
| danger.subtle | #FEE4E2 | Fondo de alerta critica. |
| text.primary | #26302A | Titulos, cifras, cuerpos importantes. |
| text.secondary | #5C6660 | Explicaciones y metadatos. |

Regla de oro: el color nunca es el unico portador de significado. Todo estado lleva
texto, icono o ambos.

### 3.3 Tipografia

Sans de sistema. Titulo de pagina 24-28 px/700 (una vez por vista); titulo de tarjeta
16-18 px/700; metrica principal 28-32 px/700; cuerpo 15-16 px/400-500; etiqueta de
dato 11-12 px/650 mayusculas moderadas; metadato 12-14 px. No bajar de 14 px en
controles, salud ni formularios. Conservar acentos en el texto visible.

### 3.4 Espaciado, forma y elevacion

Escala de 4 px: 4, 8, 12, 16, 20, 24, 32, 40, 48. Padding de tarjeta 16 px movil /
20-24 px en pantallas mayores. Bloques de pagina 20 px; dentro de un bloque 12 px.
Radio 12 px campos/filas, 16 px tarjetas, 999 px chips y FAB. Borde 1 px verde muy
suave; sombra opcional de baja elevacion. No anidar mas de dos superficies.

## 4. Arquitectura de informacion y navegacion

### 4.1 Barra inferior movil

Cinco destinos: Hoy, Plan, Calendario, Progreso, Mas. `Registro` es un FAB contextual.
`Fuerza` y `Ajustes` viven en `Mas` con pantalla propia y acceso por teclado/lector.
Altura 72-80 px + area segura; objetivo tactil >= 44x44 px; etiqueta siempre visible;
icono 20-22 px; activo con fondo verde y texto blanco; inactivo con texto oscuro
secundario (nunca gris de bajo contraste). Sin FAB en pantallas de formulario.

### 4.2 Escritorio

Contenido de lectura de 720-960 px. Desde 1024 px, segunda columna auxiliar
("Esta semana", alerta o hito) de 280-320 px solo si no interfiere con formularios. La
barra inferior pasa a lateral compacta o cabecera, con los mismos destinos y orden.

### 4.3 Una accion primaria por pantalla

Hoy: registrar/confirmar el proximo entrenamiento. Plan: ver la semana actual.
Calendario: seleccionar o reprogramar un dia. Registro: guardar. Progreso: revisar el
siguiente hito. Fuerza: registrar la sesion de hoy. Ajustes: guardado inmediato.

## 5. Especificacion de pantallas

### 5.1 Hoy

Orden: titulo + una linea de contexto; alertas accionables (max. 2 visibles); tarjeta
protagonista (proximo entrenamiento); progreso semanal de 4 datos; proximos dias
(max. 3 + "ver los demas"); recordatorio de confort rotativo.

La tarjeta protagonista: tipo, fecha si no es hoy ("Manana" antes de la fecha),
duracion en grande, intensidad en lenguaje natural, carga si aplica y un unico CTA.
Detalle tecnico bajo "Ver detalles".

Estados: hay entrenamiento hoy; es manana; es descanso (tarea valiosa, sin boton que
incite a entrenar); dolor alto reciente (aviso de recuperacion en vez de salida); plan
terminado o viaje pasado (ofrecer actualizar fecha).

La racha no es incentivo dominante: se llama "Dias activos seguidos" y lleva cerca
"Los descansos previstos protegen el plan".

### 5.2 Plan

Mapa con hitos, no acordeon interminable. Cabecera con fase actual, "Mes X de 6",
semana y horas previstas, y "Ver semana actual". Cada mes: tarjeta-resumen (fase,
rango de horas, salida mas larga, dias seguidos, equipaje objetivo, hito). Mes actual
expandido y resaltado; pasados con marca de completitud; futuros condensados. En una
semana: planificadas vs completadas/parciales/no realizadas; banda de descarga;
progresion de equipaje con nota de no subir kg y duracion a la vez. El hito incluye el
criterio de bienestar ("90 min comodos y sin dolor importante al dia siguiente").

### 5.3 Calendario

Vista semanal por defecto en movil; mensual como panorama. Un dia = una marca visual,
mas leyenda textual (planificado, completado, parcial, descanso, carga). Al tocar un
dia, su detalle se abre debajo sin cambio brusco. Un dia sin sesion ofrece "Registrar
salida de este dia" sin parecer una tarea pendiente. Mover una sesion muestra
consecuencias ("Mover al domingo crea dos dias consecutivos. Te parece bien?") y ofrece
deshacer. No permitir subir a la vez duracion y peso sin confirmacion comprensible.

### 5.4 Registro (para cuando estas cansada)

Menos de 30 s. Tres niveles:

- Nivel 1 visible: fecha (hoy), tipo (del plan), duracion real, estado
  (completado/parcial/no realizada), dolor 0-10 con etiquetas verbales, CTA "Guardar".
- Nivel 2 "Como te has sentido?": esfuerzo (RPE 1-10) y nota con prompts (sillin,
  rodillas, espalda, energia, equipaje).
- Nivel 3 "Anadir detalles opcionales": equipaje, distancia, ruta, velocidad. Equipaje
  prominente solo desde el mes 4 o si la sesion es cargada.

Dolor con control segmentado. Al elegir 5 o mas, tarjeta ambar/roja antes de guardar
("El plan recomienda parar, descansar y consultar si persiste. Puedes guardar como
parcial"); sin bloqueo ni diagnostico. Tras guardar: confirmacion util + deshacer 8-10 s.

### 5.5 Progreso (explicar antes que impresionar)

Cada modulo responde una pregunta humana. Graficas con titulo, unidad, leyenda,
alternativa textual y frase de lectura ("Esta semana hiciste 2,5 h frente a 3 h
previstas"). La carga de equipaje se escala al maximo del plan (8-9 kg), no a 0-4.
Estado vacio: no dibujar cuatro graficas sin datos; proponer la primera salida.

### 5.6 Fuerza y Mas

Fuerza: rutina breve de apoyo, no una segunda disciplina. Cada rutina con duracion
total, material, series, repeticiones, foco, tecnica breve y alternativa. Destacar
"20-30 min" y "deja 1-2 repeticiones en reserva". Mas: utilidades (tarjetas tactiles a
Fuerza, Registro y Ajustes) + Privacidad y Descargo, cortos y colapsables.

### 5.7 Ajustes

Tres niveles: Preparacion (fechas, dias, unidades; guardado inmediato con confirmacion
discreta); Datos (exportar/importar; describir el reemplazo antes de importar); Zona de
riesgo (regenerar y reiniciar; fondo separado, color de alerta, confirmacion de dos
pasos). "Regenerar plan" no usa rojo si conserva registros manuales: usa ambar y
explica lo que se conserva. Rojo solo para "Reiniciar todos los datos".

## 6. Sistema de componentes

`PageHeader`, `Card` (estandar/destacado/informativo/riesgo), `StatTile`,
`WorkoutCard`, `StatusBadge` (siempre texto + color, alto >= 24 px), `AlertBanner`
(recuperacion/precaucion/dolor/exito, max. 2 apilados), `SegmentedControl`,
`ProgressBar`, `EmptyState`, `ConfirmAction` (consecuencia antes del verbo).

Botones: primario (verde), secundario (borde verde), terciario (solo texto), peligro
(rojo solo en confirmacion final), flotante (pildora). Todos >= 44 px, `:focus-visible`
claro, `active` y `disabled` con contraste. Nunca dos primarios juntos.

Formularios: etiqueta persistente (el placeholder no la sustituye); agrupar por
decision; prellenar del plan y explicar el origen; teclado numerico para minutos y kg;
errores junto al campo en lenguaje humano; validar al salir del campo o guardar;
mantener lo escrito tras un error.

## 7. Estados, feedback y seguridad

Estados de sesion: Planificado (chip neutro), Hecho (check y verde suave, sin confeti),
Parcial (ambar suave, sin juicio), No realizado (gris calido, no rojo), Descanso (azul
suave, "Parte del plan").

Jerarquia de alertas: 1) dolor >= 5/10 (bloque al inicio, recomendacion de parar);
2) progresion riesgosa (avisar al modificar duracion y carga, antes de guardar);
3) demasiados dias consecutivos (recordatorio, no alarma); 4) informacion (descarga,
fase con equipaje). Toda alerta responde: que ocurrio, por que importa, que hacer.

Microinteracciones: 150-200 ms, curva estandar, sin rebotes. Respetar
`prefers-reduced-motion`. Vibracion solo con configuracion explicita, nunca para
avisos de salud.

## 8. Accesibilidad

Contraste AA (4.5:1 texto normal, 3:1 grande/componentes). Objetivo tactil 44x44 px y
separacion entre "Hecho" y "Registrar". Orden de foco: cabecera -> alertas -> contenido
-> FAB -> navegacion; enlace "Saltar al contenido". `aria-current="page"` en navegacion
activa; etiquetas accesibles en iconos y controles. Graficas con tabla o resumen
textual. Estados nunca solo por rojo/verde. Zoom 200 % y reflujo sin scroll horizontal
hasta 320 px. Errores con `role="alert"`, confirmaciones con `role="status"`.

## 9. Responsive y PWA offline

320-599 px: una columna, navegacion inferior. 600-1023 px: max. 680 px, metricas 2x2.
>= 1024 px: marco 960-1200 px, navegacion lateral/cabecera, auxiliar opcional. Probar a
360x800 y 390x844. FAB por encima de la barra y del area segura de iOS. Los formularios
no deben quedar bajo el teclado.

PWA: primera apertura offline explica "Tus datos se guardan en este dispositivo". Sin
banda permanente "sin conexion". Actualizacion no intrusiva ("Hay una version nueva.
Actualizar cuando termines"), sin recargar durante un formulario. Exportacion JSON como
copia local de seguridad con fecha legible.

## 10. Contenido, ilustracion e iconografia

Set SVG de trazo redondeado (1.75-2 px): mapa, calendario, grafico, bici, pesa,
ajustes, alforja, descanso/luna, alerta, check. Emoji solo en estados vacios y mensajes
de cercania, nunca en navegacion, metricas ni estados criticos. Ilustraciones: solo
bicicleta, equipaje y recuperacion; planas, mono o bicroma; 48 px compacto, 96-120 px
primer uso. Sin fotografia grande.

Voz: "Salida guardada" en vez de "Mision cumplida"; "Una salida parcial tambien cuenta
como informacion"; "Hoy toca recuperar: tambien forma parte del plan"; "El dolor merece
atencion. Reduce o descansa si persiste"; "Menos volumen esta semana para asimilar el
trabajo"; "Ya has practicado 2 h seguidas. Estas mas cerca de encadenar dias". Lenguaje
neutro o concordancia configurable; acentos correctos en el texto visible.

## 11. Metricas de calidad de diseno

Tiempo para registrar una salida planificada (mediana < 30 s); completitud de dolor/RPE
sin forzar; uso real de "parcial"; reprogramaciones entendidas; consulta semanal (no
compulsiva) de Progreso; abandono bajo tras una alerta; contraste/foco/zoom al 100 % en
rutas principales. Sesiones, rachas y minutos no son KPI de exito aislado.

## 12. Plan de implementacion por impacto

- Fase 1: navegacion de 5 destinos con `Mas` real; "Hecho" como registro rapido;
  Registro con detalles progresivos; estados de alerta y confirmacion tras guardar;
  contraste, areas tactiles y no oclusion por barra/FAB.
- Fase 2: estado vacio de Progreso; resumenes de lectura y escalas adecuadas; semana e
  hito actual en Plan; marcar descarga, descanso y progresion de equipaje.
- Fase 3: iconos SVG consistentes; tokens semanticos formalizados; variantes
  documentadas de componentes; ilustraciones SVG de estados vacios.
- Fase 4: pruebas en contexto (registro al volver de rodar, dia de dolor/parcial, mover
  un entrenamiento) y auditoria con teclado, lector, 200 % de zoom y 360 px.

## 13. Checklist de aceptacion de diseno

### Sistema visual

- [x] Cada color tiene una funcion semantica documentada.
- [x] No hay informacion critica sustentada solo por color o emoji.
- [x] Titulos, metricas y campos siguen la escala tipografica.
- [x] La densidad sigue comoda a 360 px.

### Navegacion y jerarquia

- [x] La barra inferior lleva a cinco rutas validas y la activa no depende solo del color.
- [x] Existe una accion primaria por pantalla.
- [x] Registro, Fuerza y Ajustes son alcanzables en pocos toques.
- [x] El FAB no esta donde duplica el envio del formulario.

### Registro y seguridad

- [x] Una salida planificada se registra en menos de 30 s.
- [x] Se puede guardar como parcial o no realizada sin penalizacion visual.
- [x] Dolor >= 5/10 tiene respuesta concreta, no diagnostica y no bloqueante.
- [x] Subir duracion y equipaje a la vez activa una advertencia antes de guardar.
- [x] Tras guardar hay confirmacion util y posibilidad de deshacer.

### Progreso y accesibilidad

- [x] Cada grafica explica que leer y tiene alternativa textual.
- [x] El estado vacio propone un siguiente paso y no muestra paneles sin significado.
- [x] Los controles son operables por teclado y tienen foco visible.
- [x] Objetivos tactiles, contraste y zoom cumplen los requisitos.
- [x] Las animaciones respetan la reduccion de movimiento.

## Conclusion

La interfaz debe hacer que un plan largo se sienta cercano: una salida razonable hoy,
una buena decision al registrar y una senal clara de que el cuerpo se adapta. El
siguiente salto no exige mas decoracion ni mas datos: exige jerarquia mas estricta,
registro mas humano y un sistema de estados que trate recuperacion, parcialidad y
descanso como partes valiosas del viaje.
