# Mejores practicas de UX

## Aplicadas a la app Pedalea a Polonia

Guia de diseno de producto para una aplicacion de preparacion cicloturista de seis meses.

**Proposito.** Convertir un programa de entrenamiento progresivo en una experiencia
cotidiana que ayude a entrenar con calma, detectar senales de sobrecarga y llegar a una
ruta de varios dias con confianza. El producto no debe premiar la velocidad: debe hacer
visible la constancia, la recuperacion y la tolerancia a pedalear con equipaje.

**Audiencia.** Personas que parten de 45 a 60 minutos de pedaleo comodo y preparan un
viaje de bicicleta cargada, posiblemente sin identificarse como deportistas de rendimiento.

**Principio rector.** La interfaz debe responder primero a la pregunta: "Que me conviene
hacer hoy?". Solo despues debe ofrecer analisis, registros o comparativas.

## Resumen ejecutivo

La UX optima reduce la friccion de cumplir una salida, hace explicito el permiso para
recuperar y evita que una metrica llamativa sustituya el juicio corporal. El plan debe
presentarse como una propuesta adaptable, no como una obligacion rigida. Cada
recomendacion necesita explicar su motivo y ofrecer una salida segura: completar,
acortar, mover o descansar.

| Decision de UX | Por que importa | Resultado deseado |
| --- | --- | --- |
| El tiempo domina sobre km y velocidad | La preparacion busca tolerancia a duracion y dias seguidos. | Completar 60 min suaves tiene valor aunque se recorran menos kilometros. |
| Registro de sensaciones en menos de 30 segundos | Tras una salida hay poco tiempo y energia para registrar. | Mas adherencia y senales tempranas de dolor. |
| Plan flexible con reglas visibles | Una semana dificil no debe convertirse en una lista de fallos. | Replanificacion sin sobrecompensar. |
| Carga y recuperacion como datos principales | Son especificos del objetivo de viajar con alforjas. | Progresion segura hacia 8-10 kg y bloques consecutivos. |

## 1. Contexto y resultado que la experiencia debe producir

La app acompana una progresion concreta: pasar de salidas de menos de una hora a cuatro
dias consecutivos de dos a tres horas con equipaje. La dificultad no es unicamente
fisiologica: incluye sillin, manos, espalda, organizacion, energia disponible, dudas
sobre cuando descansar y ansiedad por quedarse atras.

## 2. Principios de experiencia

### 2.1 Calma antes que urgencia

Evita retos agresivos, contadores punitivos o textos que presenten descansar como
fallar. "Hoy toca recuperacion" debe sentirse como una accion completa y valiosa.

### 2.2 El cuerpo es la fuente principal

El plan es una hipotesis. Dolor, fatiga, sueno y molestias de contacto son evidencia
nueva. La interfaz debe pedir estas senales de forma breve y actuar sobre ellas.

### 2.3 Adaptabilidad con limites

La persona puede mover, acortar o sustituir entrenamientos, pero la aplicacion protege
los principios del plan:

- No recuperar dos salidas largas pegandolas.
- No subir duracion y kg de equipaje a la vez de forma brusca.
- No eliminar una semana de descarga para recuperar volumen perdido.
- No convertir una sesion omitida en una deuda que haya que pagar.

### 2.4 Progreso legible sin interpretacion deportiva

Muestra tendencias comparadas con el propio plan, no rankings. Prioriza frases humanas
como "ya has hecho dos fines de semana consecutivos" sobre indicadores opacos.

## 3. Arquitectura de informacion y jerarquia

En movil, la navegacion principal debe ser: **Hoy**, **Plan**, **Calendario**,
**Progreso** y **Mas**. Registrar una salida debe ser una accion persistente y visible
desde cualquier pantalla.

### Una accion primaria por pantalla

En **Hoy**, la accion primaria es iniciar o completar la sesion. En **Registro**,
guardar. En **Calendario**, confirmar un cambio. Acciones de riesgo, como omitir,
reiniciar o borrar datos, deben ser secundarias y exigir confirmacion contextual.

### Divulgacion progresiva

Muestra primero duracion, intencion y nota de ritmo. Deja bajo "Ver detalles" los
bloques moderados, consejos de hidratacion, equipaje y series.

## 4. Flujo critico de Hoy

La tarjeta de la sesion debe responder que hacer, cuanto tiempo, como de intenso y por
que. Ofrece siempre una alternativa corta de 30-40 min suave cuando hay poco tiempo, y
acciones para mover o cambiar por descanso.

### Onboarding y estados vacios

Pide solo fecha de inicio, fecha aproximada del viaje y dias disponibles. No solicites
peso, FTP, rutas habituales ni cuenta.

## 5. Registro de entrenamiento de baja friccion

El registro se disena para el momento posterior a una salida: con calor, hambre o
cansancio. La duracion planificada se prellena y la persona solo confirma o ajusta.

1. Estado de la sesion: completada, parcial u omitida con botones grandes.
2. Duracion real: selector rapido en intervalos de 5 min y edicion manual.
3. Como se sintio: esfuerzo percibido y dolor con etiquetas verbales.
4. Carga: kg previstos prellenados; opcion "sin carga".
5. Notas opcionales: prompts cortos sobre sillin, manos, espalda, energia y clima.

### Diseno de escalas

Para dolor usa 0-10 con anclajes: 0 "sin dolor", 3 "molesto pero estable", 5 "me hizo
modificar la salida", 7 "me obligo a parar" y 10 "intenso". Con dolor de 5 o mas,
recomienda no intensificar y no diagnostiques.

### Que no pedir obligatoriamente

No exijas distancia, velocidad media, calorias, desnivel, frecuencia cardiaca ni fotos.

## 6. Calendario y replanificacion responsable

El calendario debe mostrar plan y realidad en la misma capa: planificado, completado,
parcial, movido y omitido. El significado no puede depender solo del color: anade
etiqueta o icono.

En movil no dependas solo de arrastrar y soltar. Anade "Mover a..." con selector de
fecha y una previsualizacion de impacto. Tras confirmar, ofrece deshacer.

Los bloques consecutivos deben leerse como una unidad: la recuperacion entre esos dias
forma parte del objetivo.

## 7. Progreso que apoya decisiones

El progreso explica si se ha acumulado el tipo de experiencia que exige la ruta y que
falta por practicar. No es un panel de telemetria.

Un semaforo de preparacion puede existir, pero no como puntuacion opaca. Debe mostrar
condiciones: "Te falta completar una salida de 3 h con carga" o "El siguiente paso es la
simulacion". Si hay dolor alto, debe prevalecer la precaucion aunque las horas esten al
dia.

Evita usar rojo como unico mensaje para una sesion omitida y muestra "sin registro", no
"0".

## 8. Carga, ergonomia y recuperacion

Registro cualitativo de contacto y equipaje: sillin, manos/cuello, espalda, energia y
dolor articular.

**Regla de progreso segura.** Si se sube de 4 a 7 kg, se mantiene o reduce la duracion
durante la adaptacion. Si se aumenta la salida larga, se mantiene la carga. Haz visible
esa logica.

## 9. Accesibilidad e inclusividad

- Objetivos tactiles de 44 x 44 px o mas.
- Contraste AA y significado redundante (texto, icono y patron; no solo verde/rojo).
- Base tipografica de 16 px en movil; "2 h 30 min", no "2:30" ambiguo.
- Toda grafica tiene una tabla o resumen textual.
- Lenguaje claro y no culpabilizador: "sesion no realizada", no "fallo".
- Datos locales por defecto; explicar que se guarda; no enviar ubicacion sin decision
  expresa.

## 10. Microcopy y tono

Tono de companera de ruta prudente: directo, sereno y especifico. Evita lenguaje militar
y clinico innecesario.

| Situacion | Evitar | Preferir |
| --- | --- | --- |
| Sesion omitida | "Has roto la racha". | "Esta salida no se realizo. Puedes moverla o continuar con la siguiente". |
| Descarga | "Semana facil". | "Semana de recuperacion: reduce volumen para consolidar la adaptacion". |
| Dolor alto | "Debes entrenar menos". | "El dolor cambio la salida. No aumentes carga o duracion hasta que mejore". |
| Salida cargada | "Desafio de 8 kg". | "Practica con 8 kg: observa manos, espalda y estabilidad". |
| Hito | "Nivel desbloqueado". | "Hito logrado: 90 min comodos y recuperacion estable". |

Tras un registro, devuelve una observacion util, no solo "guardado".

## 11. Patrones que conviene evitar

- Gamificacion basada en competir, clasificaciones publicas, calorias o badges por
  entrenar pese al dolor.
- Un plan ineditable que castiga clima, trabajo, familia o fatiga.
- Graficas complejas sin suficientes datos.
- Alarmas frecuentes.
- Formularios largos que bloquean el cierre de una salida.
- Recomendaciones que prescriben tratamiento o diagnostican lesiones.

## 12. Checklist de entrega UX

- [x] La pantalla Hoy permite decidir y actuar sin abrir otra seccion.
- [x] Un entrenamiento se registra con duracion, estado, esfuerzo y dolor en menos de 30 s.
- [x] La app explica las descargas y no incentiva compensarlas.
- [x] Mover una sesion muestra el impacto sobre recuperacion y consecutividad.
- [x] Duracion y kg no aumentan de manera agresiva a la vez (alerta dedicada).
- [x] El estado de preparacion muestra condiciones comprensibles, no una puntuacion opaca.
- [x] Todos los estados se entienden sin depender solo del color.
- [x] Los datos se guardan localmente, se pueden exportar y se eliminan con confirmacion.
- [x] Las alertas de dolor son prudentes, especificas y no diagnostican.
- [x] La experiencia funciona y se entiende en una pantalla movil pequena.

## Conclusion

La mejor UX para Pedalea a Polonia no convierte el entrenamiento en un juego de numeros.
Hace que el plan sea facil de ejecutar, que las senales del cuerpo sean visibles y que
una adaptacion necesaria no se viva como un retroceso.
