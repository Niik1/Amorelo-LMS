// Fase 0 — sitemap.xml (SEO).
// TODO(Fase 8): ampliar con rutas dinámicas (cursos), lastModified y
// prioridades; ver plan §10.

import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/cursos", "/nosotros"].map((path) => ({
    url: `${siteConfig.url}${path}`,
  }));
}
