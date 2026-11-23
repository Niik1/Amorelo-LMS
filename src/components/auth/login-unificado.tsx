"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  iniciarSesionUnificado,
  confirmarExpulsionYSesionAlumno,
  cancelarInicioSesionAlumno,
} from "@/server/auth/acciones";
import { createClient } from "@/lib/supabase/client";

import { AuthPanelLateral } from "./auth-panel-lateral";
import { LoginForm } from "./login-form";
import { RecuperarClaveForm } from "./recuperar-clave-form";
import { SesionActivaAlerta } from "./sesion-activa-alerta";
import { MfaDesafioForm } from "./mfa-desafio-form";
import { CambiarClaveInicialForm } from "./cambiar-clave-inicial-form";

export type VistaAuth = "login" | "recuperar" | "conflicto" | "mfa" | "cambiar_clave";

export function LoginUnificado() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to");
  const viewParam = searchParams.get("view");
  const motivoParam = searchParams.get("motivo");

  const [vista, setVista] = useState<VistaAuth>(
    viewParam === "recuperar" ? "recuperar" : "login"
  );

  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [recordarSesion, setRecordarSesion] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(
    motivoParam === "sesion_duplicada"
      ? "Tu sesión anterior fue cerrada porque se inició sesión en otro dispositivo."
      : null
  );

  // Estado para la confirmación de Sesión Única (RF-EST-26)
  const [conflictoSesion, setConflictoSesion] = useState<{
    dispositivo: string;
    navegador: string;
    iniciadaEn: string;
  } | null>(null);

  // Estado para Segundo Factor (MFA / 2FA del Administrador)
  const [codigoMfa, setCodigoMfa] = useState("");
  // Estado para Cloudflare Turnstile anti-bots
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const token = turnstileToken || undefined;
      // Inmediatamente limpiar el token local para que nunca se intente reutilizar
      setTurnstileToken(null);

      const res = await iniciarSesionUnificado(
        correo,
        clave,
        false,
        token
      );

      if (!res.ok) {
        toast.error(res.error || "Correo o contraseña incorrectos.");
        setError(res.error);
        setCargando(false);
        return;
      }

      // Si es alumno y tiene sesión previa abierta en otro dispositivo:
      if (res.rol === "student" && res.requiereConfirmacionSesion) {
        toast.warning("Sesión activa detectada en otro dispositivo.");
        setConflictoSesion(res.sesionPrevia);
        setVista("conflicto");
        setCargando(false);
        return;
      }

      // Si es alumno y debe cambiar su contraseña temporal por primera vez:
      if (res.rol === "student" && res.debeCambiarClave) {
        toast.info("Por tu seguridad, define tu contraseña personal para acceder al aula.");
        setVista("cambiar_clave");
        setCargando(false);
        return;
      }

      // Si es admin y requiere código MFA de 6 dígitos:
      if (res.rol === "admin" && res.requiereMfa) {
        toast.info("Ingresa el código de 6 dígitos de tu aplicación de autenticación.");
        setVista("mfa");
        setCargando(false);
        return;
      }

      // Redirección exitosa
      toast.success("¡Bienvenida de vuelta!", {
        description: "Iniciando tu sesión...",
      });
      const destinoFinal =
        redirectTo && redirectTo.startsWith("/") ? redirectTo : res.destino;
      router.push(destinoFinal);
      router.refresh();
    } catch (err) {
      console.error("[LoginUnificado]", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al iniciar sesión.";
      toast.error(msg);
      setError(msg);
      setCargando(false);
    }
  };

  const handleConfirmarExpulsion = async () => {
    setError(null);
    setCargando(true);

    try {
      const res = await confirmarExpulsionYSesionAlumno();
      if (!res.ok) {
        toast.error(res.error || "No se pudo cerrar la sesión anterior.");
        setError(res.error);
        setCargando(false);
        return;
      }

      toast.success("Sesión anterior cerrada con éxito", {
        description: "Iniciando sesión en este equipo...",
      });

      if (res.debeCambiarClave) {
        setVista("cambiar_clave");
        setCargando(false);
        return;
      }

      const destinoFinal =
        redirectTo && redirectTo.startsWith("/") ? redirectTo : res.destino;
      router.push(destinoFinal);
      router.refresh();
    } catch (err) {
      console.error("[handleConfirmarExpulsion]", err);
      const msg = "Ocurrió un error inesperado al confirmar la sesión.";
      toast.error(msg);
      setError(msg);
      setCargando(false);
    }
  };

  const handleCancelarExpulsion = async () => {
    setError(null);
    setCargando(true);
    await cancelarInicioSesionAlumno();
    toast.info("Inicio de sesión cancelado.");
    setConflictoSesion(null);
    setClave("");
    setTurnstileToken(null);
    setCargando(false);
    setVista("login");
  };

  const handleVerificarMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const supabase = createClient();
      const factores = await supabase.auth.mfa.listFactors();
      const factorId = factores.data?.totp?.[0]?.id;

      if (!factorId) {
        const msg = "No se encontró el factor de autenticación configurado.";
        toast.error(msg);
        setError(msg);
        setCargando(false);
        return;
      }

      const { data: challenge, error: challengeErr } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr || !challenge) {
        const msg = "Error iniciando el desafío de seguridad.";
        toast.error(msg);
        setError(msg);
        setCargando(false);
        return;
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: codigoMfa.trim(),
      });

      if (verifyErr) {
        const msg = "Código de verificación incorrecto o expirado.";
        toast.error(msg);
        setError(msg);
        setCargando(false);
        return;
      }

      toast.success("Identidad verificada con éxito", {
        description: "Accediendo al panel de administración...",
      });

      const destino =
        redirectTo && redirectTo.startsWith("/")
          ? redirectTo
          : "/panel-admin/dashboard";
      router.push(destino);
      router.refresh();
    } catch {
      const msg = "Error validando el código de seguridad.";
      toast.error(msg);
      setError(msg);
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-2xl transition-all duration-300 dark:border-blue-400/25 dark:bg-[#0D1A4F] dark:backdrop-blur-xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[580px]">
        {/* ========================================================
            COLUMNA 1 (IZQUIERDA): Panel Visual Fijo (Branding y Frases)
            ======================================================== */}
        <AuthPanelLateral />

        {/* ========================================================
            COLUMNA 2 (DERECHA): Conmuta dinámicamente según la acción
            ======================================================== */}
        {vista === "login" && (
          <LoginForm
            correo={correo}
            setCorreo={setCorreo}
            clave={clave}
            setClave={setClave}
            mostrarClave={mostrarClave}
            setMostrarClave={setMostrarClave}
            recordarSesion={recordarSesion}
            setRecordarSesion={setRecordarSesion}
            cargando={cargando}
            error={error}
            onSubmit={(e) => void handleLogin(e)}
            onOlvideClave={() => {
              setError(null);
              setVista("recuperar");
            }}
            onTurnstileSuccess={(token) => setTurnstileToken(token)}
            onTurnstileExpire={() => setTurnstileToken(null)}
          />
        )}

        {vista === "recuperar" && (
          <RecuperarClaveForm
            correoInicial={correo}
            onVolver={() => {
              setError(null);
              setVista("login");
            }}
          />
        )}

        {vista === "conflicto" && conflictoSesion && (
          <SesionActivaAlerta
            sesionPrevia={conflictoSesion}
            cargando={cargando}
            error={error}
            onConfirmarExpulsion={handleConfirmarExpulsion}
            onCancelar={handleCancelarExpulsion}
          />
        )}

        {vista === "mfa" && (
          <MfaDesafioForm
            codigoMfa={codigoMfa}
            setCodigoMfa={setCodigoMfa}
            cargando={cargando}
            error={error}
            onSubmit={handleVerificarMfa}
            onVolver={() => {
              setCodigoMfa("");
              setError(null);
              setVista("login");
            }}
          />
        )}

        {vista === "cambiar_clave" && (
          <CambiarClaveInicialForm
            correoAlumno={correo}
            destinoFinal={redirectTo && redirectTo.startsWith("/") ? redirectTo : "/aula"}
          />
        )}
      </div>
    </div>
  );
}
