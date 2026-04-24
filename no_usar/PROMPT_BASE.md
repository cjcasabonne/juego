ACTÚA COMO:
Arquitecto de software senior, especializado en:
- aplicaciones web multiusuario
- Supabase (Postgres, Auth, Realtime, RLS, Storage)
- arquitectura sin backend tradicional
- sistemas operables reales, no demos
- productos web mobile-first con posible evolución a PWA y wrapper móvil

OBJETIVO DE TU RESPUESTA:
Diseñar la arquitectura completa, precisa y operable de una webapp de juego para parejas.
NO quiero código de implementación todavía.
NO quiero ideas genéricas.
NO quiero “depende” salvo que expliques exactamente por qué.
Quiero una arquitectura concreta, accionable y coherente con todo el contexto ya decidido.

IMPORTANTE:
Debes tratar todas las decisiones de producto y arquitectura de abajo como REQUISITOS CERRADOS.
NO las rediscutas.
NO propongas alternativas salvo que detectes una contradicción técnica real.
Si detectas una contradicción, debes señalarla explícitamente y luego proponer la corrección mínima.

==================================================
1. NATURALEZA DEL PRODUCTO
==================================================

Es una webapp de juego para parejas.

No es un quiz trivial.
No es una trivia pública.
No es una red social.
Es un juego emocional de:
- predicción
- revelación
- teasing
- conversación
- tensión romántica / spicy

El producto debe optimizar:
- fluidez
- claridad
- sorpresa
- persistencia del estado
- simplicidad operativa

Debe ser:
- multiusuario
- multi-pareja
- multi-sesión
- sin backend propio si no es inevitable

==================================================
2. REQUISITOS DE INFRAESTRUCTURA Y FILOSOFÍA
==================================================

Reglas obligatorias:
- minimizar infraestructura propia
- no usar backend completo para CRUD
- la seguridad debe vivir en la base de datos
- usar RLS para control de acceso
- el frontend controla UX, no seguridad
- no microservicios
- no Docker
- no Kubernetes
- no backend innecesario
- no lógica duplicada entre frontend y backend
- una sola URL canónica en producción
- almacenamiento persistente del estado de juego
- diseño operable, no solo “bonito”

Stack obligado:
- Frontend: webapp desplegada en Cloudflare Pages
- Backend/BaaS: Supabase
  - Postgres
  - Auth
  - Realtime
  - RLS
- Sin servidor propio intermedio para la v1

Evolución futura prevista:
- PWA
- posible empaquetado con Capacitor para Play Store
La arquitectura debe quedar preparada para esto sin reingeniería importante.

==================================================
3. MODELO SOCIAL Y AUTENTICACIÓN
==================================================

Autenticación:
- usar Supabase Auth
- cada usuario debe tener identidad real en sistema
- el sistema debe usar user_id confiable derivado de auth

Modelo social:
- un usuario puede tener múltiples parejas
- una pareja se forma por invitación
- la invitación puede ser por código o link
- la pareja NO está hardcodeada
- NO asumir relación 1 usuario = 1 pareja

Debe existir una entidad explícita para:
- couple / pareja
- membership / membresía de usuario en pareja

Quiero que el diseño contemple claramente:
- ownership
- visibilidad de datos
- permisos por pareja
- sesiones asociadas a una pareja concreta

==================================================
4. GAME LOOP CERRADO (NO CAMBIAR)
==================================================

El loop del juego ya está definido y NO debes rediseñarlo.

FASE 1 — RESPUESTAS INICIALES
- ambos jugadores responden todas las preguntas de la sesión
- nadie ve las respuestas del otro
- la fase no avanza hasta que ambos hayan terminado todas las respuestas
- se debe guardar progreso parcial
- si uno sale, luego puede retomar

FASE 2 — PREDICCIÓN
- solo se habilita cuando ambos hayan terminado la FASE 1
- cada jugador responde 1 pregunta a la vez
- al hacer click en una opción:
  - se evalúa inmediatamente si acertó o no
  - se muestra feedback visual inmediato (correcto/incorrecto)
  - hay delay visual de 1000ms
  - luego se pasa a la siguiente pregunta
- no se puede corregir después del click
- no se revela todavía la respuesta real del otro
- la fase termina solo cuando ambos completan todas las predicciones

FASE 3 — REVEAL
- el reveal NO es sincronizado
- cada jugador puede avanzar el reveal a su propio ritmo
- primero debe existir un reveal 1 by 1
- luego un resumen final con lista completa
- en esta fase sí se ve:
  - lo que uno predijo
  - lo que realmente respondió la pareja

Reglas adicionales:
- el avance fuerte de estado es por fase, no por pregunta
- fase 2 no empieza hasta que ambos terminen fase 1
- fase 3 no empieza hasta que ambos terminen fase 2
- el reveal no requiere sincronización en tiempo real entre ambos

==================================================
5. REGLAS DE BLOQUEO Y RETOMA
==================================================

No habrá timeout automático.
Si uno abandona:
- la sesión queda bloqueada en la fase actual
- no avanza automáticamente
- puede retomarse después

Debe existir funcionalidad de:
- detectar sesiones no terminadas
- retomar sesión
- persistir el punto exacto donde quedó cada usuario dentro de la fase

IMPORTANTE:
Aunque una sesión quede bloqueada, la pareja puede iniciar otra sesión distinta.
Por lo tanto:
- puede haber múltiples sesiones simultáneas por pareja
- una sesión puede estar bloqueada en fase 2
- otra sesión distinta puede empezar en fase 1
- el estado debe vivir en la sesión, no en la pareja

==================================================
6. TIPOS DE PREGUNTAS Y SCORING
==================================================

Distribución de tipos para v1:
- 60% multiple choice
- 30% híbridas
- 10% texto libre

Definición operativa:
1. multiple choice
- selección cerrada
- scoring automático

2. híbrida
- tiene componente de opción cerrada
- puede mostrar componente textual en el reveal
- scoring automático SOLO por la opción, no por el texto

3. texto libre
- no se scorea automáticamente
- requiere validación manual

Validación de texto libre:
- la validación la hace quien respondió originalmente
- esa persona marca si la predicción del otro fue acierto o no
- esto debe quedar reflejado en el modelo de datos

==================================================
7. CONTENIDO, CATEGORÍAS E INTENSIDAD
==================================================

Las preguntas tienen:
- tipo
- categoría
- intensidad
- texto de pregunta
- opciones cuando aplique
- activación/desactivación

Categorías:
- visibles para el usuario
- ejemplo de categorías: light, flirty, spicy, savage
- puedes usar esos nombres o proponer equivalentes, pero deben ser visibles

Intensidad:
- rango 1–5
- visible o al menos modelada explícitamente
- no reducirlo a 1–3

Selección de preguntas por sesión:
- random puro
- 10 preguntas por ronda/sesión
- evitar repetición dentro de la misma sesión
- no hace falta resolver historial anti-repetición global en v1, pero puedes mencionarlo como evolución futura

==================================================
8. FUENTES DE PREGUNTAS
==================================================

Habrá al menos dos orígenes de preguntas:

1. Banco global/base
- preguntas base del sistema
- curadas
- compartidas

2. Preguntas de pareja
- creadas por los propios usuarios
- asociadas a una pareja específica
- deben entrar automáticamente al pool del juego
- no deben requerir aprobación manual

Debes diseñar cómo mezclar:
- preguntas globales
- preguntas de pareja

La mezcla debe ser clara y operable.
No quiero vaguedades.

==================================================
9. IMPORTACIÓN / EXPORTACIÓN DE PREGUNTAS
==================================================

Debe existir una pestaña/flujo para gestión de preguntas.

Debe permitir:
- descargar plantilla
- llenar preguntas fuera de la app
- subir archivo al juego
- importar preguntas
- exportar preguntas existentes
- compartir packs potencialmente en el futuro

Formato elegido:
- Excel (.xlsx), no CSV
Porque:
- es más fácil de llenar
- permite dropdowns y validaciones visuales

La plantilla debe contemplar:
- columnas estructuradas
- ejemplos
- mecanismos para minimizar errores de usuario

Reglas cerradas de importación:
- columna question_id
- columna is_example
- question_id vacío => crear nueva pregunta
- question_id existente => ignorar, no actualizar
- is_example = true => ignorar siempre
- importación append-only
- NO updates por reupload
- NO overwrite
- NO merge complejo

La lógica buscada es:
- si el usuario sube el mismo archivo varias veces, no duplica preguntas existentes
- si se olvida de borrar ejemplos, no pasa nada porque deben ignorarse
- modificar preguntas no debe hacerse por reupload, sino dentro de la app si luego se implementa edición

Quiero que diseñes:
- estructura exacta de plantilla
- columnas recomendadas
- validaciones
- flujo de importación
- cómo se manejan errores fila por fila
- cómo se evita que una pareja toque preguntas de otra pareja

==================================================
10. ELIMINACIÓN / DESACTIVACIÓN DE PREGUNTAS
==================================================

No se deben borrar preguntas físicamente en v1.
Se deben desactivar.

Regla:
- usar is_active = false o equivalente
- no hard delete como mecanismo normal

La arquitectura debe considerar:
- preguntas activas
- preguntas desactivadas
- que las desactivadas no entren al pool de nuevas sesiones

==================================================
11. UX Y ESTADO DE JUEGO
==================================================

Decisiones ya tomadas:
- fase 2 muestra 1 pregunta a la vez
- el feedback es inmediato
- delay visual fijo de 1000ms
- no se puede cambiar la predicción una vez hecha
- no se muestra la respuesta real en fase 2
- el reveal es posterior
- el reveal 1 by 1 es individual, no sincronizado

Debes diseñar el sistema de estado para soportar:
- progreso parcial de respuestas
- progreso parcial de predicciones
- bloqueo por fase
- reveal individual por usuario
- resumen final
- retoma exacta de una sesión

IMPORTANTE:
Diferenciar claramente:
- estado global de la sesión
- estado por usuario dentro de la sesión
- estado por pregunta dentro de la sesión
- estado del reveal individual

==================================================
12. SEGURIDAD Y RLS
==================================================

Esto es crítico.

Debes diseñar la seguridad asumiendo que:
- el frontend NO es confiable para permisos
- todo acceso debe estar respaldado por RLS

Necesito que propongas políticas RLS claras para:
- perfiles de usuario
- parejas
- membresías de pareja
- invitaciones
- preguntas globales
- preguntas por pareja
- sesiones de juego
- rondas o equivalentes
- respuestas
- predicciones
- validaciones de texto
- progreso del reveal

Debes evitar:
- accesos cruzados entre parejas
- que alguien lea sesiones de una pareja ajena
- que alguien importe preguntas en nombre de otra pareja
- que alguien manipule la validación de texto si no es quien respondió
- que alguien vea respuestas del otro antes de que la fase lo permita, si esto depende de consultas

Si necesitas separar tablas o vistas para lograrlo, propónlo.

==================================================
13. REALTIME
==================================================

Quiero realtime mínimo y correcto.
No quiero sobreuso de realtime.

Debes definir exactamente:
- qué sí debe sincronizarse en realtime
- qué no necesita realtime
- qué eventos o tablas conviene escuchar

Pistas:
- los cambios importantes son de fase/sesión/progreso agregado
- no hace falta sync por reveal 1 by 1 porque el reveal es individual
- sí hace falta detectar que ambos completaron fase 1 o fase 2
- sí hace falta detectar que una sesión puede retomarse o que cambió de estado

Quiero que expliques:
- cómo usar Supabase Realtime sin race conditions innecesarias
- cómo evitar depender solo del frontend para cambiar de fase
- si propones triggers o funciones SQL, justifícalo

==================================================
14. RESTRICCIÓN MUY IMPORTANTE: SIN BACKEND PROPIO
==================================================

No propongas:
- API Express
- NestJS
- servidor Node dedicado
- microservicio
- backend intermedio solo por comodidad

Solo puedes introducir lógica de servidor si es realmente inevitable y, si lo haces, debe ser:
- mínima
- puntual
- justificada
- preferentemente dentro de Supabase (SQL, funciones, políticas, trigger, edge function solo si no hay alternativa mejor)

El principio es:
CRUD y estado => base de datos + RLS
auth => Supabase Auth
realtime => Supabase
frontend => UX

==================================================
15. PREPARACIÓN PARA PWA / PLAY STORE
==================================================

La arquitectura debe quedar preparada para:
- PWA
- wrapper móvil con Capacitor en el futuro

Esto implica que debes evitar:
- decisiones de routing frágiles
- dependencias innecesarias de entorno
- modelos de auth que luego fallen en wrapper móvil por mezcla de URLs

Menciona explícitamente:
- URL canónica
- consideraciones de auth redirect
- qué cosas deben cuidarse desde ya para no tener reingeniería después

==================================================
16. LO QUE QUIERO COMO SALIDA
==================================================

Quiero que respondas con esta estructura exacta:

A. DIAGNÓSTICO DEL PROBLEMA REAL
- explicar qué sistema se está construyendo realmente
- dónde está la complejidad real
- qué errores típicos hay que evitar

B. ARQUITECTURA FINAL PROPUESTA
- componentes
- responsabilidades
- flujo general
- justificación de por qué no hace falta backend propio

C. MODELO DE DATOS DETALLADO
- lista completa de tablas
- columnas importantes
- claves primarias
- claves foráneas
- ownership claro
- estado global vs estado por usuario
- cómo modelar múltiples parejas por usuario
- cómo modelar múltiples sesiones por pareja
- cómo modelar preguntas globales y de pareja
- cómo modelar importación append-only con question_id e is_example

D. MÁQUINA DE ESTADOS DEL JUEGO
- estados de sesión
- transiciones permitidas
- qué condición dispara cada transición
- qué estado es global y cuál es individual
- cómo manejar retoma y bloqueo

E. ESTRATEGIA DE SCORING
- automático
- manual
- qué se guarda y qué se calcula
- cómo evitar inconsistencias

F. ESTRATEGIA DE SELECCIÓN DE PREGUNTAS
- random puro
- mezcla global + pareja
- evitar repetición dentro de la sesión
- asignación de 10 preguntas a una sesión concreta

G. IMPORTACIÓN / EXPORTACIÓN EXCEL
- diseño de plantilla
- columnas
- hojas sugeridas
- manejo de ejemplos
- validaciones
- reglas de ignorado por question_id existente
- reglas de ignorado por is_example
- ownership y seguridad
- flujo exacto de importación desde frontend

H. POLÍTICAS RLS
- por tabla
- qué puede leer/escribir cada usuario
- qué chequeos dependen de membresía de pareja
- cómo restringir preguntas de pareja y sesiones

I. REALTIME
- qué se escucha
- qué no
- cómo detectar avance de fase
- cómo evitar race conditions
- si recomiendas SQL function / trigger / computed state, explicarlo

J. FRONTEND Y MÓDULOS
- páginas/pestañas principales
- estado local vs remoto
- manejo de sesión activa
- manejo de retoma
- manejo de reveal individual

K. DEPLOY Y CONFIGURACIÓN CRÍTICA
- Cloudflare Pages
- Supabase
- variables de entorno
- URL canónica
- redirect URLs
- errores típicos a evitar

L. EVOLUCIÓN POR FASES
- v1 operable
- v2 mejoras
- v3 crecimiento
- qué NO meter en v1

M. RIESGOS Y ANTI-PATRONES
- lista concreta de errores que romperían este diseño

==================================================
17. REGLAS DE RESPUESTA
==================================================

- No respondas con código de implementación salvo snippets mínimos si hacen falta para explicar una decisión.
- No des una respuesta superficial.
- No omitas tablas críticas.
- No digas “usar una tabla para X” sin explicar sus columnas mínimas.
- No propongas backend propio salvo imposibilidad real.
- No contradigas decisiones ya tomadas.
- No simplifiques el modelo social a una sola pareja por usuario.
- No simplifiques el modelo de sesiones a una sola sesión por pareja.
- No ignores importación Excel.
- No ignores RLS.
- No ignores retomar partida.
- No ignores reveal individual.
- No ignores que el scoring del híbrido es solo por opción.
- No ignores que texto libre se valida por quien respondió.
- No ignores que question_id existente se ignora y no actualiza.
- No ignores que is_example debe hacer que una fila nunca se importe.
- No ignores que las preguntas se desactivan, no se borran.
- No ignores que pueden coexistir varias sesiones por pareja.

Si una decisión tiene varias opciones posibles, elige una y justifícala.
Prioriza:
- robustez
- simplicidad operativa
- seguridad basada en datos
- claridad de ownership
- mínima infraestructura