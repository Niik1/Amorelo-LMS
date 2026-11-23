// Configuración de Sentry para el lado del servidor Node.js.
// Captura excepciones en Server Actions, Route Handlers, webhooks y consultas a la base de datos.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ||
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://5db2a8e7a94f6f6045f9416ad3c170bb@o4512071806877696.ingest.us.sentry.io/4512071821885440",

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
});
