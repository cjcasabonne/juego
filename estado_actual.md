# Checklist

- [ ] Supabase project creado
- [x] Variables de entorno configuradas
- [x] Cliente Supabase frontend creado
- [x] Auth callback operativo
- [x] Bundle SQL unificado preparado
- [x] Smoke checks SQL preparados
- [ ] Tablas creadas en Supabase
- [ ] Indices creados en Supabase
- [ ] Funciones SQL creadas en Supabase
- [ ] Triggers creados en Supabase
- [ ] RLS habilitado en Supabase
- [ ] Policies creadas en Supabase
- [ ] Usuarios de prueba creados
- [x] Flujo de creacion de pareja implementado
- [x] Flujo de join por invite code implementado
- [x] CRUD minimo de preguntas de pareja implementado
- [x] Importacion Excel implementada
- [ ] Dataset inicial cargado
- [x] RPC `fn_create_session` conectado al frontend
- [x] Session router implementado
- [x] Realtime de `game_sessions` implementado
- [x] Phase 1 implementada
- [x] Retoma de Phase 1 implementada
- [x] Phase 2 implementada
- [x] Retoma de Phase 2 implementada
- [x] Phase 3 implementada
- [x] Validacion manual de free text implementada
- [x] Summary final implementado
- [x] Recuperacion de sesion activa implementada
- [ ] QA con dos usuarios completado
- [ ] Deploy en Cloudflare Pages completado

# Estado por modulo

## DB schema
- Estado: listo para aplicar
- Responsable:
- Ultima actualizacion:
- Nota: `sql/00_apply_all.sql` preparado como bundle ejecutable.

## RLS
- Estado: listo para aplicar
- Responsable:
- Ultima actualizacion:
- Nota: incluido en `sql/00_apply_all.sql`; validable con `sql/05_smoke_checks.sql`.

## Auth
- Estado: en progreso
- Responsable:
- Ultima actualizacion:
- Nota: login por magic link, callback y guard implementados.

## Couples
- Estado: en progreso
- Responsable:
- Ultima actualizacion:
- Nota: listado, create y join conectados a Supabase.

## Questions
- Estado: en progreso
- Responsable:
- Ultima actualizacion:
- Nota: listado, alta manual y desactivacion implementados.

## Import Excel
- Estado: en progreso
- Responsable:
- Ultima actualizacion:
- Nota: parseo XLSX, validacion y deduplicacion por scope implementados.

## Sessions
- Estado: en progreso
- Responsable:
- Ultima actualizacion:
- Nota: crear sesion por RPC y router por status implementados.

## Game Phase 1
- Estado: en progreso
- Responsable:
- Ultima actualizacion:
- Nota: carga de preguntas de sesion, respuestas propias, progreso, guardado y cierre de phase1 implementados.

## Game Phase 2
- Estado: en progreso
- Responsable:
- Ultima actualizacion:
- Nota: captura de predicciones, progreso, retoma y cierre de phase2 implementados.

## Game Phase 3
- Estado: en progreso
- Responsable:
- Ultima actualizacion:
- Nota: reveal por posicion, avance individual y validacion manual de free text implementados.

## Summary
- Estado: en progreso
- Responsable:
- Ultima actualizacion:
- Nota: score consolidado implementado desde predictions + free_text_validations.

## Deploy
- Estado: build local OK
- Responsable:
- Ultima actualizacion:
- Nota: `npm run build` compila sin errores.

# Bloqueos actuales

- El SQL ya se aplico desde SQL Editor segun ejecucion manual.
- La API REST del proyecto sigue respondiendo `404` para tablas y RPC esperadas.
- Falta confirmar que el SQL se aplico en el proyecto correcto y que PostgREST expone `public`.
- La conectividad a Supabase ya esta confirmada.
- QA con dos usuarios sigue bloqueado hasta tener backend listo y usuarios de prueba.

# Proximos pasos inmediatos

- [ ] Crear proyecto Supabase
- [ ] Ejecutar `sql/00_apply_all.sql`
- [ ] Ejecutar `sql/05_smoke_checks.sql`
- [ ] Cargar dataset inicial
- [ ] Crear 2 usuarios de prueba
- [ ] Ejecutar QA vivo con 2 usuarios

# Registro manual

## Hecho hoy
- Auth real con magic link, callback y guard.
- Modulo base de parejas: listado, crear y unirse.
- Modulo de preguntas manuales implementado.
- Importacion Excel implementada.
- Creacion de sesion y router de fase implementados.
- Phase 1 real implementada sobre `answers` y `user_session_state`.
- Phase 2 real implementada sobre `predictions` y `user_session_state`.
- Phase 3 real implementada con reveal y validacion manual.
- Summary final y recuperacion de sesiones activas implementados.
- Build local verificado.
- Bundle SQL unificado preparado en `sql/00_apply_all.sql`.
- Smoke checks preparados en `sql/05_smoke_checks.sql`.

## En curso
- Ejecucion del loop principal del juego.

## Siguiente accion
- Ejecutar `sql/05_smoke_checks.sql` dentro de SQL Editor y confirmar que las tablas/RPC existen en el mismo proyecto configurado en `app/.env`.
