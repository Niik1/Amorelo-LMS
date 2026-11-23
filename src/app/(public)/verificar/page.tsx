// Validador Público de Certificados Oficiales de Amorelo.
// Accesible públicamente mediante escaneo de código QR o ingreso manual del código.

import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { VerificadorCliente } from "@/components/public/verificador-cliente";
import type { CertificadoVerificado, CertificadoReemplazante } from "./actions";

export const metadata = {
  title: "Validador Oficial de Certificados | Amorelo",
  description: "Verifica la autenticidad y validez oficial de certificados emitidos por Amorelo.",
};

interface VerificarPageProps {
  searchParams: Promise<{ codigo?: string }>;
}

export default async function VerificarPage({ searchParams }: VerificarPageProps) {
  const { codigo } = await searchParams;
  const codigoLimpio = (codigo || "").trim().toUpperCase();

  let initialCertificado: CertificadoVerificado | null = null;
  let initialReemplazante: CertificadoReemplazante | null = null;

  if (codigoLimpio) {
    const admin = createAdminClient();

    // Buscar el certificado por su código exacto
    const { data: cert } = await admin
      .from("certificados")
      .select("*")
      .or(`codigo_verificacion.eq.${codigoLimpio},codigo_verificacion.ilike.${codigoLimpio}`)
      .maybeSingle();

    if (cert) {
      let qrDataUrl = "";
      try {
        qrDataUrl = await QRCode.toDataURL(
          `https://amorelo.pe/verificar?codigo=${cert.codigo_verificacion}`,
          {
            margin: 1,
            width: 140,
            color: { dark: "#0F172A", light: "#FFFFFF" },
          }
        );
      } catch {
        // noop
      }

      initialCertificado = { ...cert, qrDataUrl } as CertificadoVerificado;

      // Si fue anulado y tiene un reemplazante, buscar el nuevo certificado vigente
      if (cert.estado === "anulado") {
        const { data: nuevo } = await admin
          .from("certificados")
          .select("codigo_verificacion, nombre_certificado, emitido_en")
          .eq("reemplaza_certificado_id", cert.id)
          .in("estado", ["vigente", "emitido"])
          .maybeSingle();

        if (nuevo) {
          initialReemplazante = nuevo;
        }
      }
    }
  }

  return (
    <main
      className="min-h-screen pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden flex flex-col justify-start transition-colors duration-500 bg-[var(--public-page-bg)] [background:var(--public-page-gradient)]"
    >
      {/* Resplandor ambiental cenital de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -z-0 -translate-x-1/2 blur-3xl opacity-30"
      >
        <div className="h-[24rem] w-[50rem] rounded-full bg-blue-400/40 dark:bg-blue-500" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full">
        {/* Encabezado Principal */}
        <div className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12] transition-colors">
            ¿Es auténtico este certificado?
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-blue-200/75 max-w-xl mx-auto leading-relaxed font-normal transition-colors">
            Escribe el código único del certificado. Comprobamos el registro de la academia y te mostramos el documento original.
          </p>
        </div>

        {/* Buscador interactivo, estado de carga progresivo y vistas de resultado */}
        <VerificadorCliente
          initialCodigo={codigoLimpio}
          initialCertificado={initialCertificado}
          initialReemplazante={initialReemplazante}
        />
      </div>
    </main>
  );
}
