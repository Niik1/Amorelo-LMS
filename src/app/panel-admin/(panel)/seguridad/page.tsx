// Seguridad del panel: dispositivos TOTP vinculados y alta de un respaldo.

import { ShieldCheck } from "lucide-react";
import { SegundoFactor } from "@/components/admin/segundo-factor";
import { createClient } from "@/lib/supabase/server";
import { ModuloBanner } from "@/components/ui/modulo-banner";

export default async function SeguridadPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  // `totp` viene filtrado a verificados: son los que sirven para entrar.
  const factores = (data?.totp ?? []).map((f) => ({
    id: f.id,
    nombre: f.friendly_name || "Dispositivo",
    creadoEn: f.created_at,
  }));

  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <ModuloBanner
        titulo="Seguridad y Segundo Factor (MFA)"
        descripcion="Protege el acceso a tu panel administrativo configurando autenticación de dos pasos con Google Authenticator, Microsoft Authenticator o tu app preferida."
        icono={ShieldCheck}
      />
      <SegundoFactor factores={factores} />
    </main>
  );
}
