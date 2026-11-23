// Fase 3 — Autenticación de los endpoints cron.
// Responsabilidad: validar la cabecera de CRON_SECRET en /api/cron/* para que
// solo el programador (Vercel Cron, GitHub Actions, etc.) pueda invocarlos.
// TODO(Fase 3): implementar la comparación segura del secreto.

export {};
