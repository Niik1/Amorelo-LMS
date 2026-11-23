// Layout del panel autenticado (/panel-admin/*).
// No indexar (ruta oculta). Segunda capa: además del proxy, verifica en cada
// render que la sesión sea de un admin activo Y que haya completado el segundo
// factor (aal2); si el proxy fallara, igual responde 404.
// Chrome: sidebar colapsable + topbar. Tipografía Inter (font-admin).

import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);
  if (!adminId) notFound();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nombre_completo,correo")
    .eq("id", adminId)
    .maybeSingle();

  const nombre =
    (perfil as { nombre_completo?: string } | null)?.nombre_completo ??
    "Admin";
  const correo =
    (perfil as { correo?: string } | null)?.correo ?? "";

  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="font-admin flex min-h-svh w-full">
          <AppSidebar nombre={nombre} correo={correo} />
          <SidebarInset className="bg-canvas text-foreground">
            <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-black/10 bg-white px-4 dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-foreground" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1A73E8] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 dark:bg-blue-950/60 dark:border-blue-800/60 dark:text-blue-400">
                  Admin
                </span>
                <p className="text-sm font-bold text-heading">
                  Panel de Control Amorelo
                </p>
              </div>
            </header>
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </div>
        <Toaster position="top-center" />
      </TooltipProvider>
    </SidebarProvider>
  );
}
