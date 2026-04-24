# Estructura

```text
/src
  /app
    App.tsx
    router.tsx
    providers.tsx
  /config
    env.ts
  /lib
    supabase.ts
    realtime.ts
  /auth
    /pages
      LoginPage.tsx
      AuthCallbackPage.tsx
    /components
      AuthGuard.tsx
    /hooks
      useAuthSession.ts
      useCurrentUser.ts
    /services
      auth.service.ts
  /profiles
    /hooks
      useProfile.ts
    /services
      profiles.service.ts
  /couples
    /pages
      CouplesPage.tsx
      CreateCouplePage.tsx
      JoinCouplePage.tsx
    /components
      CoupleCard.tsx
      InviteCodeBox.tsx
    /hooks
      useCouples.ts
      useCreateCouple.ts
      useJoinCouple.ts
    /services
      couples.service.ts
      couple-members.service.ts
  /questions
    /pages
      QuestionsPage.tsx
      NewQuestionPage.tsx
    /components
      QuestionForm.tsx
      QuestionsTable.tsx
    /hooks
      useQuestions.ts
      useCreateQuestion.ts
      useDisableQuestion.ts
    /services
      questions.service.ts
    /mappers
      question.mapper.ts
  /import
    /pages
      ImportQuestionsPage.tsx
    /components
      ImportDropzone.tsx
      ImportSummary.tsx
    /hooks
      useExcelImport.ts
    /services
      import.service.ts
    /parsers
      excel.parser.ts
    /validators
      import.validator.ts
  /sessions
    /pages
      SessionRouterPage.tsx
      SessionWaitingPage.tsx
      SessionSummaryPage.tsx
    /components
      ActiveSessionCard.tsx
    /hooks
      useActiveSessions.ts
      useCreateSession.ts
      useSession.ts
      useSessionQuestions.ts
      useSessionRealtime.ts
    /services
      sessions.service.ts
      session-questions.service.ts
      user-session-state.service.ts
  /game
    /phase1
      /pages
        Phase1Page.tsx
      /components
        AnswerQuestionCard.tsx
        PhaseProgress.tsx
      /hooks
        usePhase1Answers.ts
        usePhase1Progress.ts
      /services
        answers.service.ts
    /phase2
      /pages
        Phase2Page.tsx
      /components
        PredictionQuestionCard.tsx
        PhaseProgress.tsx
      /hooks
        usePhase2Predictions.ts
        usePhase2Progress.ts
      /services
        predictions.service.ts
    /phase3
      /pages
        Phase3Page.tsx
      /components
        RevealCard.tsx
        RevealControls.tsx
      /hooks
        useRevealState.ts
        useRevealFeed.ts
      /services
        reveal.service.ts
        free-text-validations.service.ts
  /shared
    /components
      PageShell.tsx
      LoadingState.tsx
      EmptyState.tsx
      ErrorState.tsx
      Button.tsx
      Input.tsx
      Modal.tsx
    /hooks
      useAsyncAction.ts
      useMountedRef.ts
    /utils
      dates.ts
      errors.ts
      strings.ts
      ids.ts
    /types
      db.ts
      domain.ts
```

# Módulos

- `auth`: login, callback, sesión actual, guardas.
- `profiles`: lectura de perfil actual.
- `couples`: crear pareja, unirse por código, listar membresías.
- `questions`: CRUD mínimo de preguntas de pareja.
- `import`: parseo Excel, validación, inserción por lotes.
- `sessions`: creación de sesión, lookup de sesión activa, routing por fase.
- `game/phase1`: respuestas.
- `game/phase2`: predicciones.
- `game/phase3`: reveal y validación de free text.
- `shared`: UI base, helpers y tipos.

# Servicios

- Un servicio por tabla o RPC.
- Los servicios solo hablan con Supabase.
- Los hooks consumen servicios.
- Las páginas consumen hooks.
- Los componentes no hacen queries directas.

# Hooks necesarios

- `useAuthSession`
- `useCurrentUser`
- `useProfile`
- `useCouples`
- `useCreateCouple`
- `useJoinCouple`
- `useQuestions`
- `useCreateQuestion`
- `useDisableQuestion`
- `useExcelImport`
- `useActiveSessions`
- `useCreateSession`
- `useSession`
- `useSessionQuestions`
- `useSessionRealtime`
- `usePhase1Answers`
- `usePhase1Progress`
- `usePhase2Predictions`
- `usePhase2Progress`
- `useRevealState`
- `useRevealFeed`

# Servicios mínimos

- `auth.service.ts`
- `profiles.service.ts`
- `couples.service.ts`
- `couple-members.service.ts`
- `questions.service.ts`
- `import.service.ts`
- `sessions.service.ts`
- `session-questions.service.ts`
- `user-session-state.service.ts`
- `answers.service.ts`
- `predictions.service.ts`
- `reveal.service.ts`
- `free-text-validations.service.ts`

# Convenciones de nombres

- Componentes: `PascalCase.tsx`
- Hooks: `useNombre.ts`
- Servicios: `recurso.service.ts`
- Mappers: `recurso.mapper.ts`
- Validators: `recurso.validator.ts`
- Parsers: `recurso.parser.ts`
- Tipos globales: `domain.ts`, `db.ts`
- Rutas: kebab-case en URL

# Rutas frontend

- `/`
- `/login`
- `/auth/callback`
- `/couples`
- `/couples/new`
- `/couples/join`
- `/questions`
- `/questions/new`
- `/import/questions`
- `/session/:sessionId`
- `/session/:sessionId/phase1`
- `/session/:sessionId/phase2`
- `/session/:sessionId/phase3`
- `/session/:sessionId/summary`

# Responsabilidades

- `lib/supabase.ts`: cliente único.
- `lib/realtime.ts`: helpers de suscripción.
- `sessions.service.ts`: RPC `fn_create_session`, lectura de `game_sessions`.
- `answers.service.ts`: insert de respuestas y lectura propia.
- `predictions.service.ts`: insert de predicciones y lectura propia.
- `reveal.service.ts`: lectura de reveal permitido y avance de `reveal_position`.
- `import.service.ts`: inserción batch e idempotencia.
- `excel.parser.ts`: lectura de archivo y normalización de filas.
- `import.validator.ts`: validación de columnas y reglas antes de insertar.
