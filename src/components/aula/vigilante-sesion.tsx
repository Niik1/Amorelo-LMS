"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface VigilanteSesionProps {
  perfilId: string;
}

function decodificarJwtPayload(token: string): { session_id?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload =
      typeof window !== "undefined"
        ? decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          )
        : Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function VigilanteSesion({ perfilId }: VigilanteSesionProps) {
  const [expulsado, setExpulsado] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(10);
  const expulsadoRef = useRef(false);

  const redirigirAlLogin = () => {
    if (typeof window !== "undefined") {
      window.location.replace("/login?motivo=sesion_duplicada");
    }
  };

  // Temporizador regresivo de 10 segundos al ser expulsado
  useEffect(() => {
    if (!expulsado) return;

    const timer = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          redirigirAlLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expulsado]);

  useEffect(() => {
    let activo = true;
    const supabase = createClient();
    let canalRealtime: ReturnType<typeof supabase.channel> | null = null;

    const ejecutarExpulsion = async () => {
      if (expulsadoRef.current) return;
      expulsadoRef.current = true;
      setExpulsado(true);

      // Pausar cualquier video o iframe reproduciéndose en el DOM
      try {
        const videos = document.querySelectorAll("video");
        videos.forEach((v) => v.pause());
      } catch {
        // noop
      }

      try {
        await supabase.auth.signOut();
      } catch {
        // noop
      }
    };

    const iniciarVigilante = async () => {
      // 1. Obtener la sesión activa directamente en el navegador del alumno
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !activo) return;

      const payload = decodificarJwtPayload(session.access_token);
      const miSessionId = payload?.session_id;

      if (!miSessionId || !activo) return;

      const targetPerfilId = perfilId || session.user.id;

      // 2. Autenticar el WebSocket en Supabase Realtime con el JWT del alumno
      try {
        await supabase.realtime.setAuth(session.access_token);
      } catch (err) {
        console.warn("[VigilanteSesion] Error configurando auth en Realtime:", err);
      }

      if (!activo) return;

      // 3. Suscribirse por WebSocket al canal en tiempo real
      canalRealtime = supabase
        .channel(`sesion_alumno_${targetPerfilId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "sesiones_activas",
            filter: `perfil_id=eq.${targetPerfilId}`,
          },
          (payloadRealtime) => {
            if (payloadRealtime.eventType === "DELETE") {
              void ejecutarExpulsion();
              return;
            }

            const nuevaFila = payloadRealtime.new as
              | { session_id?: string }
              | undefined;

            if (
              nuevaFila &&
              nuevaFila.session_id &&
              nuevaFila.session_id !== miSessionId
            ) {
              void ejecutarExpulsion();
            }
          }
        )
        .subscribe();
    };

    void iniciarVigilante();

    // 4. Respaldo anti-suspensión: solo se ejecuta si el usuario cambia de pestaña y regresa
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible" || expulsadoRef.current) return;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const payload = decodificarJwtPayload(session.access_token);
        const miSessionId = payload?.session_id;
        if (!miSessionId) return;

        const targetPerfilId = perfilId || session.user.id;

        const { data } = await supabase
          .from("sesiones_activas")
          .select("session_id")
          .eq("perfil_id", targetPerfilId)
          .maybeSingle();

        if (data && data.session_id && data.session_id !== miSessionId) {
          void ejecutarExpulsion();
        }
      } catch {
        // noop
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      activo = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (canalRealtime) {
        void supabase.removeChannel(canalRealtime);
      }
    };
  }, [perfilId]);

  if (!expulsado) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-white p-6 text-center shadow-2xl transition-all sm:p-8 dark:bg-[#0D1A4F]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 dark:bg-amber-400/15 dark:text-amber-400">
          <ShieldAlert className="h-9 w-9" />
        </div>

        <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Sesión cerrada
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-blue-200/80">
          Se ha iniciado sesión con tu cuenta desde otro dispositivo. Por
          política de seguridad, solo puedes tener una sesión activa a la vez.
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-blue-200">
          Redirigiendo automáticamente en{" "}
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
            {segundosRestantes}s
          </span>
        </div>

        <div className="mt-6">
          <Button
            type="button"
            onClick={redirigirAlLogin}
            className="h-12 w-full rounded-xl text-base font-bold shadow-md transition-all bg-[#1A73E8] hover:bg-[#1557B0] text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            Volver al inicio de sesión ({segundosRestantes}s)
          </Button>
        </div>
      </div>
    </div>
  );
}
