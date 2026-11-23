// Fase 0 — robots.txt (SEO).
// Bloquea /panel-admin, /checkout y /aula como indica el plan.
// TODO(Fase 8): revisar dominio definitivo y reglas de rastreo.

import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/panel-admin", "/checkout", "/aula"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
