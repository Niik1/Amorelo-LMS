// Al recargar, el navegador restaura el scroll anterior y la página arranca
// bajada (en mobile se nota porque el titular queda bajo el navbar). Solo en
// recargas se vuelve al tope; atrás/adelante conserva su restauración nativa.

"use client";

import { useEffect } from "react";

export function ReloadTop() {
  useEffect(() => {
    const [navigation] = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];
    if (navigation?.type === "reload") {
      window.scrollTo(0, 0);
    }
  }, []);

  return null;
}
