// Layout del aula virtual (/aula/*).
// Verificación de sesión de alumno. Chrome: sidebar colapsable + topbar.
// No indexar. Tipografía Inter (font-admin para consistencia con el panel).

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AulaSidebar } from "@/components/aula/aula-sidebar";
import { VigilanteSesion } from "@/components/aula/vigilante-sesion";
import { ModalCambiarClaveObligatoria } from "@/components/aula/modal-cambiar-clave-obligatoria";
import { ModalOnboardingFidelizacion } from "@/components/aula/modal-onboarding-fidelizacion";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Aula Virtual",
  robots: { index: false, follow: false },
};

export default async function AulaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect_to=/aula");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nombre_completo, correo, rol, activo, debe_cambiar_clave, cliente_id")
    .eq("id", user.id)
    .maybeSingle();

  // Solo alumnos activos acceden al aula (los admin van a /panel-admin)
  if (!perfil || !perfil.activo || perfil.rol !== "student") {
    redirect("/login");
  }

  const nombre = perfil.nombre_completo ?? "Alumno";
  const correo = perfil.correo ?? "";

  // Onboarding Progresivo de Fidelización: si no tiene fecha de nacimiento registrada en clientes
  let mostrarFidelizacion = false;
  let ciudadCliente: string | null = null;

  if (!perfil.debe_cambiar_clave) {
    const admin = createAdminClient();
    let cliente: { fecha_nacimiento: string | null; ciudad: string | null } | null = null;

    if (perfil.cliente_id) {
      const { data } = await admin
        .from("clientes")
        .select("fecha_nacimiento, ciudad")
        .eq("id", perfil.cliente_id)
        .maybeSingle();
      cliente = data;
    }

    if (!cliente) {
      const { data } = await admin
        .from("clientes")
        .select("fecha_nacimiento, ciudad")
        .eq("correo", (correo || user.email || "").trim().toLowerCase())
        .maybeSingle();
      cliente = data;
    }

    if (cliente && !cliente.fecha_nacimiento) {
      mostrarFidelizacion = true;
      ciudadCliente = cliente.ciudad;
    }
  }

  return (
    <SidebarProvider>
      <TooltipProvider>
        <VigilanteSesion perfilId={user.id} />
        <ModalCambiarClaveObligatoria
          abierto={Boolean(perfil.debe_cambiar_clave)}
          correoAlumno={correo}
        />
        <ModalOnboardingFidelizacion
          mostrarModal={mostrarFidelizacion}
          nombreAlumno={nombre}
          ciudadInicial={ciudadCliente}
        />
        <div className="font-admin flex min-h-svh w-full min-w-0 overflow-x-hidden">
          <AulaSidebar nombre={nombre} correo={correo} />
          <SidebarInset className="bg-canvas text-foreground min-w-0 max-w-full overflow-x-hidden">
            <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-black/10 bg-white px-4 dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <p className="text-sm font-bold text-heading">Aula Virtual</p>
              </div>
            </header>
            <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">{children}</div>
          </SidebarInset>
        </div>
        <Toaster position="top-center" />
      </TooltipProvider>
    </SidebarProvider>
  );
}
