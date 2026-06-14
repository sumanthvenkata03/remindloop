# packages/shared

The single source of truth for the **Reminder** data contract shared by the app
and the backend.

For Phase 2 the canonical schema lives at `app/src/lib/schema.ts` (kept inside the
app so Expo's bundler stays simple). In Phase 3, when the backend is introduced,
the schema moves here and both `/app` and `/backend` import it, so they can never
drift apart.
