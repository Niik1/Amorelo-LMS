// Configuración de Sentry para el lado del cliente (Navegador).
// Captura excepciones no controladas de JavaScript en el aula virtual, tienda y checkout.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://5db2a8e7a94f6f6045f9416ad3c170bb@o4512071806877696.ingest.us.sentry.io/4512071821885440",

  // Ajuste de tasa de muestreo de trazas de rendimiento (10% en prod, 100% en dev)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Captura de sesión en video/replay solo cuando ocurre un error (muy útil para depurar)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,

  // Filtrar ruidos comunes de extensiones del navegador
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
    "Network request failed",
    "Load failed",
  ],
});
