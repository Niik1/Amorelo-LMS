// Helper para resolución dinámica de URL base del sitio.
// Funciona en localhost, en entornos de Vercel (preview y producción), y con dominios propios.

export function obtenerBaseUrl(): string {
  // 1. Variable explícita de configuración del sitio
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 2. Variable automática de despliegue en Vercel
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  // 3. Ejecución en navegador
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  // 4. Fallback de desarrollo local
  return "http://localhost:3000";
}
