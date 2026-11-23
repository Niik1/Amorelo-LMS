// Fase 0 — Layout del grupo público (envuelve inicio, cursos, nosotros,
// contacto y legales).

import { SiteHeader } from "@/components/public/site-header";
import { WhatsAppFloat } from "@/components/public/whatsapp-float";
import { ReloadTop } from "@/components/public/reload-top";
import { Footer } from "@/components/public/footer";
import { OfertaRefresco } from "@/components/public/oferta-refresco";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ReloadTop />
      <SiteHeader />
      {children}
      <Footer />
      <WhatsAppFloat />
      <OfertaRefresco />
    </>
  );
}
