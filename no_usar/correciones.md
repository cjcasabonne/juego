ROL:
Eres un arquitecto de software senior. No estás diseñando desde cero. Estás auditando y corrigiendo una arquitectura existente.

CONTEXTO:
usas completa la arquitectura previamente diseñada para una webapp de juego de parejas (Supabase + Cloudflare Pages, sin backend propio) en arqui.md
ejecut. 
___


__

TU OBJETIVO:
NO rediseñar.
NO simplificar.
NO cambiar decisiones de producto.

Tu trabajo es:
1. consolidar la arquitectura en un documento base
2. detectar fallos reales
3. aplicar correcciones mínimas y justificadas

==================================================
PASO 1 — CREAR ARCHIVO BASE (OBLIGATORIO)
==================================================

Debes modificar el archivo llamado:

arqui.md

Este archivo debe contener:
- TODA la arquitectura original reorganizada
- estructura clara por secciones:
  A. Diagnóstico
  B. Arquitectura
  C. Modelo de datos
  D. Máquina de estados
  E. Scoring
  F. Selección de preguntas
  G. Importación Excel
  H. RLS
  I. Realtime
  J. Frontend
  K. Deploy
  L. Evolución
  M. Riesgos

IMPORTANTE:
- NO cambies nada en este paso
- NO corrijas nada aún
- solo reorganiza y normaliza formato
- este archivo es la “fuente de verdad inicial”

==================================================
PASO 2 — AUDITORÍA TÉCNICA
==================================================

Analiza la arquitectura y detecta:

1. ERRORES CRÍTICOS (rompen lógica o seguridad)
2. RIESGOS (pueden romper en producción)
3. INCONSISTENCIAS (estado duplicado, lógica frágil)
4. PROBLEMAS DE ESCALA (queries, índices, performance)
5. HUECOS (casos no cubiertos)

Para cada problema:
- explica el problema
- explica el impacto real
- referencia la sección de arqui.md afectada

==================================================
PASO 3 — CORRECCIONES CONTROLADAS
==================================================

Aplica SOLO correcciones necesarias.

REGLAS:
- NO rediseñar todo
- NO introducir backend nuevo
- NO cambiar el modelo conceptual
- NO cambiar reglas de juego
- NO eliminar tablas existentes (salvo error grave)

SÍ puedes:
- ajustar constraints
- agregar índices
- corregir triggers
- mejorar RLS
- refinar funciones SQL
- corregir inconsistencias

Para cada corrección:
- mostrar ANTES
- mostrar DESPUÉS
- explicar por qué

==================================================
PASO 4 — GENERAR ARCHIVO FINAL
==================================================

Debes generar:

arqui_fixed.md

Este archivo debe ser:
- la versión corregida
- limpia
- coherente
- lista para implementación

Debe incluir:
- modelo de datos corregido
- triggers corregidos
- RLS ajustado
- decisiones justificadas (breve)

==================================================
REGLAS ESTRICTAS
==================================================

❌ NO rehacer arquitectura
❌ NO cambiar decisiones ya tomadas (ej: append-only, sin timeout, etc.)
❌ NO introducir backend propio
❌ NO simplificar el modelo social (sigue siendo múltiples parejas y sesiones)
❌ NO eliminar importación Excel
❌ NO eliminar RLS

✔ SÍ corregir:
- race conditions
- problemas de integridad
- inconsistencias de estado
- errores en triggers
- problemas de seguridad

==================================================
FORMATO DE RESPUESTA
==================================================

1. arqui.md (completo, sin cambios)
2. lista de problemas detectados
3. lista de correcciones aplicadas (antes/después)
4. arqui_fixed.md final

==================================================
CRITERIO DE CALIDAD
==================================================

La arquitectura final debe ser:
- operable en producción
- consistente en DB
- segura con RLS
- sin race conditions
- sin duplicación de lógica
- sin backend innecesario

Si algo ya está bien:
NO lo cambies.