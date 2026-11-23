import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginUnificado } from "@/components/auth/login-unificado";

export const metadata: Metadata = {
  title: "Iniciar Sesión | Amorelo",
  description: "Accede a la plataforma de cursos virtuales y panel de gestión de Amorelo.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando...</div>}>
      <LoginUnificado />
    </Suspense>
  );
}
