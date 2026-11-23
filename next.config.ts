import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Fase 0 — Cabeceras de seguridad básicas (plan §11).
// CSP estricta queda diferida (plan §11): primero en modo Report-Only, en Fase 8.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  images: {
    // Los Webp de public/ se reemplazan seguido durante el desarrollo.
    // El optimizer de next/image cacheaba variantes en disco 4h (default
    // minimumCacheTTL=14400) y seguía sirviendo archivos viejos o incluso
    // borrados. Con unoptimized se sirve el archivo original tal cual
    // (Cache-Control: max-age=0 + ETag), así que reemplazar una imagen se
    // refleja al recargar. Los Webp ya vienen optimizados y pesan <160KB.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "amorelo",
  project: "amorelo",
  silent: true,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  telemetry: false,
});
