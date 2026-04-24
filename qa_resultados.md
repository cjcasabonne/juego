# QA Resultados

Fecha: 2026-04-23

## QA ejecutado en workspace

### 1. Validacion estatica

- `npm run lint`:
  - Estado: OK
- `npm run build`:
  - Estado: OK

### 2. Conectividad minima Supabase

- Request a `https://fldwyncytunzadjnsuer.supabase.co/auth/v1/settings`
  - Estado: OK
  - HTTP: `200`

### 2. Cobertura funcional implementada verificada por inspeccion y compilacion

- Auth:
  - magic link
  - callback
  - guard de rutas
- Couples:
  - crear pareja
  - unirse por invite code
  - listado
- Questions:
  - alta manual
  - listado global y de pareja
  - desactivacion
- Import Excel:
  - parseo xlsx
  - filtro `is_example`
  - validacion de filas
  - deduplicacion por `question_id` + scope
- Sessions:
  - crear sesion por `fn_create_session`
  - router por `game_sessions.status`
  - sesiones activas visibles
- Phase 1:
  - guardado en `answers`
  - retoma
  - marcado de `phase1_completed`
- Phase 2:
  - guardado en `predictions`
  - retoma
  - marcado de `phase2_completed`
- Phase 3:
  - reveal por `reveal_position`
  - validacion manual de `free_text`
- Summary:
  - score consolidado desde `predictions` + `free_text_validations`

## Hallazgos de QA estatico corregidos

- Reglas de hooks / React compiler:
  - corregidas
- `lint`:
  - ahora pasa
- `build`:
  - sigue pasando

## Riesgos actuales detectados

- Bundle de frontend grande:
  - `vite` reporta chunk > 500 kB
  - No bloquea v1
  - Recomendacion posterior: code splitting

## QA vivo parcialmente bloqueado

Ya no hay placeholders en `app/.env`.

La conectividad base a Supabase existe.

Intento de validacion REST posterior a la aplicacion SQL:

- request a `/rest/v1/profiles?select=*&limit=1`
  - Estado: `404`
- mismo resultado para:
  - `couples`
  - `couple_members`
  - `questions`
  - `game_sessions`
  - `session_questions`
  - `user_session_state`
  - `answers`
  - `predictions`
  - `free_text_validations`
- RPC:
  - `fn_join_couple`: `404`
  - `fn_create_session`: `404`

Lectura operativa:

- el proyecto responde
- pero PostgREST no esta exponiendo el schema esperado en este proyecto
- o el SQL se aplico en otro proyecto distinto
- o el cache/schema expuesto no coincide todavia

Lo que sigue bloqueado es:

- aplicar el bundle `sql/00_apply_all.sql`
- correr `sql/05_smoke_checks.sql`
- ejecutar flujo con 2 usuarios reales
- validar datos reales en tablas

## Matriz de QA vivo pendiente

### A. Provisioning

- [ ] Crear proyecto Supabase real
- [ ] Ejecutar `sql/00_apply_all.sql`
- [ ] Ejecutar `sql/05_smoke_checks.sql`
- [ ] Configurar `app/.env` con valores reales

### B. Auth

- [ ] Login usuario A
- [ ] Login usuario B
- [ ] Confirmar filas en `profiles`
- [ ] Confirmar callback y persistencia de sesion

### C. Couples

- [ ] Usuario A crea pareja
- [ ] Usuario B entra con `invite_code`
- [ ] Confirmar 2 miembros en `couple_members`
- [ ] Verificar que un tercer usuario no pueda unirse

### D. Questions

- [ ] Crear pregunta manual `multiple_choice`
- [ ] Crear pregunta manual `hybrid`
- [ ] Crear pregunta manual `free_text`
- [ ] Desactivar una pregunta
- [ ] Confirmar visibilidad por RLS

### E. Import Excel

- [ ] Importar archivo con filas validas
- [ ] Confirmar que `is_example=true` se ignora
- [ ] Confirmar deduplicacion por scope
- [ ] Confirmar rechazo de filas invalidas

### F. Session creation

- [ ] Crear sesion con pareja completa
- [ ] Confirmar 10 filas en `session_questions`
- [ ] Confirmar 2 filas en `user_session_state`
- [ ] Confirmar error si el pool tiene menos de 10 preguntas

### G. Phase 1

- [ ] Usuario A responde 10 preguntas
- [ ] Usuario B responde 10 preguntas
- [ ] Confirmar `phase1_completed=true` en ambos
- [ ] Confirmar transicion a `phase2`
- [ ] Confirmar que no se pueden leer respuestas del partner antes de `phase3`

### H. Phase 2

- [ ] Usuario A crea 10 predicciones
- [ ] Usuario B crea 10 predicciones
- [ ] Confirmar `phase2_completed=true` en ambos
- [ ] Confirmar transicion a `phase3`
- [ ] Confirmar rechazo de predicciones fuera de `phase2`

### I. Phase 3

- [ ] Usuario A avanza reveal hasta 10
- [ ] Usuario B avanza reveal hasta 10
- [ ] Confirmar actualizacion individual de `reveal_position`
- [ ] Confirmar transicion a `completed`
- [ ] Confirmar `completed_at`

### J. Free text validation

- [ ] Validar una prediccion de texto libre correcta
- [ ] Validar una prediccion de texto libre incorrecta
- [ ] Confirmar bloqueo de validacion por usuario no autorizado

### K. Summary

- [ ] Abrir `/session/:id/summary`
- [ ] Confirmar score consolidado por usuario
- [ ] Confirmar pendientes cuando falten validaciones

### L. RLS y seguridad

- [ ] Usuario A no puede crear sesion para pareja ajena
- [ ] Usuario A no puede actualizar `user_session_state` de B
- [ ] Usuario A no puede insertar `answers` fuera de `phase1`
- [ ] Usuario A no puede insertar `predictions` fuera de `phase2`
- [ ] Usuario A no puede ver `predictions` de B antes de `phase3`

## Estado final de QA

- QA estatico: aprobado
- QA end-to-end con backend real: pendiente por visibilidad real del schema en PostgREST

## Bundle listo para aplicar

- SQL unificado: `sql/00_apply_all.sql`
- Validacion posterior: `sql/05_smoke_checks.sql`
