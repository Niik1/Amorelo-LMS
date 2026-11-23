// Refresco invisible al volver a la pestaña: si el live cambió mientras
// la landing estaba abierta, el sticker y el resto del contenido se
// actualizan. No hay polling: solo reacciona cuando la pestaña vuelve a
// estar visible, así que no genera tráfico en segundo plano.
//
// El mensaje de WhatsApp no depende de esto: lo resuelve /api/ir/whatsapp
// en el momento del clic.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OfertaRefresco() {
  const router = useRouter();

  useEffect(() => {
    const alVolver = () => {
      if (!document.hidden) router.refresh();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [router]);

  return null;
}
