// Botón Salir del panel: cierra la sesión en el servidor y vuelve al login.

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cerrarSesionApp } from "@/server/auth/acciones";

export function BotonSalir() {
  const [saliendo, setSaliendo] = useState(false);

  const salir = async () => {
    setSaliendo(true);
    try {
      await cerrarSesionApp();
    } catch {}

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}

    window.location.href = "/login";
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={saliendo}
      onClick={() => void salir()}
    >
      {saliendo ? "Saliendo…" : "Salir"}
    </Button>
  );
}
