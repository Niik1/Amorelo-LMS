// Segundo factor de autenticación (MFA / TOTP) para administradores.
// Diseño en 2 columnas optimizado para cero-scroll y alto contraste en modo oscuro.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  QrCode,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Check,
  Smartphone,
  Trash2,
  Lock,
  ArrowRight,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { diaLima } from "@/lib/fechas";
import { toast } from "sonner";

export type FactorVista = {
  id: string;
  nombre: string;
  creadoEn: string;
};

async function postJson(url: string, cuerpo: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    ok?: boolean;
    secreto?: string;
    factorId?: string;
    uri?: string;
    qr_code?: string;
  } | null;
  return { status: res.status, data };
}

export function SegundoFactor({ factores }: { factores: FactorVista[] }) {
  const router = useRouter();
  const [secreto, setSecreto] = useState("");
  const [factorId, setFactorId] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [quitando, setQuitando] = useState("");
  const [copiado, setCopiado] = useState(false);

  const cancelar = () => {
    setSecreto("");
    setFactorId("");
    setQrCodeUrl("");
    setCodigo("");
    setError("");
  };

  const generar = async () => {
    setCargando(true);
    setError("");
    setQrCodeUrl("");
    const { data } = await postJson("/api/panel-admin/login/enrolar", {});
    setCargando(false);
    if (!data?.secreto || !data?.factorId) {
      setError(data?.error ?? "No se pudo generar el código.");
      return;
    }
    setSecreto(data.secreto);
    setFactorId(data.factorId);

    // Generar imagen QR nítida optimizada (220px para máxima legibilidad sin desbordar)
    if (data.uri) {
      try {
        const qrUrl = await QRCode.toDataURL(data.uri, {
          width: 220,
          margin: 1,
          color: {
            dark: "#0F172A",
            light: "#FFFFFF",
          },
        });
        setQrCodeUrl(qrUrl);
      } catch (err) {
        console.warn("No se pudo generar QR con la librería:", err);
      }
    } else if (data.qr_code) {
      setQrCodeUrl(`data:image/svg+xml;utf8,${encodeURIComponent(data.qr_code)}`);
    }
  };

  const copiarClave = () => {
    if (!secreto) return;
    navigator.clipboard.writeText(secreto);
    setCopiado(true);
    toast.success("¡Clave de respaldo copiada!");
    setTimeout(() => setCopiado(false), 2500);
  };

  const activar = async () => {
    setCargando(true);
    setError("");
    const { data } = await postJson("/api/panel-admin/login/activar", {
      codigo,
      factorId,
    });
    setCargando(false);
    if (!data?.ok) {
      setError(data?.error ?? "Código inválido. Revisa tu aplicación e intenta nuevamente.");
      return;
    }
    setSecreto("");
    setFactorId("");
    setQrCodeUrl("");
    setCodigo("");
    setListo(true);
    toast.success("Segundo factor de autenticación activado con éxito.");
    router.refresh();
  };

  const quitar = async (id: string) => {
    setQuitando(id);
    setError("");
    const { data } = await postJson(
      "/api/panel-admin/seguridad/quitar-factor",
      { factorId: id },
    );
    setQuitando("");
    if (!data?.ok) {
      setError(data?.error ?? "No se pudo quitar el dispositivo.");
      return;
    }
    toast.success("Dispositivo desvinculado.");
    router.refresh();
  };

  const tieneFactores = factores.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
      {/* ======================================================== */}
      {/* COLUMNA IZQUIERDA: Estado y Dispositivos Vinculados      */}
      {/* ======================================================== */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
        <div className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground dark:text-white">
                Dispositivos Vinculados
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
                {factores.length} {factores.length === 1 ? "dispositivo activo" : "dispositivos activos"}
              </p>
            </div>
            {tieneFactores ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40">
                <ShieldCheck className="size-3.5" />
                Protegido
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40">
                <ShieldAlert className="size-3.5" />
                Sin 2FA
              </span>
            )}
          </div>

          {!tieneFactores ? (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 p-5 text-center border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center gap-2">
              <div className="size-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Smartphone className="size-5" />
              </div>
              <p className="text-xs font-bold text-foreground dark:text-slate-100">
                No tienes ningún dispositivo configurado
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs font-medium">
                Activa el segundo factor para blindar el acceso a tu cuenta administrativa ante cualquier intento no autorizado.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {factores.map((factor) => (
                <li
                  key={factor.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 dark:border-slate-800 bg-card dark:bg-slate-950/50 p-3.5 transition-all hover:border-primary/40 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary dark:bg-blue-500/20 dark:text-blue-300 flex items-center justify-center shrink-0">
                      <Smartphone className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-bold text-foreground dark:text-white">
                        {factor.nombre}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                        Activo desde {diaLima(factor.creadoEn)}
                      </p>
                    </div>
                  </div>
                  {factores.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={quitando === factor.id}
                      onClick={() => void quitar(factor.id)}
                      className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
                    >
                      {quitando === factor.id ? (
                        "..."
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      Principal
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Tips de seguridad compactos con alto contraste */}
          <div className="rounded-2xl bg-blue-50/80 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 p-3.5 flex items-start gap-2.5 text-xs text-blue-950 dark:text-slate-200 shadow-xs">
            <Info className="size-4 shrink-0 text-[#1A73E8] dark:text-blue-400 mt-0.5" />
            <p className="leading-snug text-[11px] font-medium">
              Compatible con <strong className="text-blue-900 dark:text-white font-bold">Google Authenticator</strong>, <strong className="text-blue-900 dark:text-white font-bold">Microsoft Authenticator</strong> o <strong className="text-blue-900 dark:text-white font-bold">1Password</strong>. Puedes vincular hasta 2 dispositivos de respaldo.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* COLUMNA DERECHA: Estación de Acción y Enrolamiento        */}
      {/* ======================================================== */}
      <div className="lg:col-span-7 xl:col-span-8">
        <div className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          {listo ? (
            /* Vista de éxito */
            <div className="flex flex-col items-center justify-center text-center p-6 gap-4">
              <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <h3 className="text-base sm:text-lg font-bold text-foreground dark:text-white">
                  ¡Segundo Factor Activado!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200 font-medium">
                  Tu dispositivo autenticador quedó verificado y enlazado. En cada nuevo inicio de sesión se te solicitará el código de 6 dígitos.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setListo(false)}
                className="h-10 px-6 rounded-xl font-bold bg-[#1D3987] hover:bg-[#152960] text-white dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm"
              >
                Listo, volver
              </Button>
            </div>
          ) : secreto ? (
            /* =================================================== */
            /* VISTA DE ENROLAMIENTO: SUB-GRID 2 COLUMNAS (ZERO SCROLL) */
            /* =================================================== */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void activar();
              }}
              className="flex flex-col gap-5"
            >
              <div className="flex items-center justify-between border-b border-border/70 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-[#1D3987]/10 dark:bg-blue-500/20 text-[#1D3987] dark:text-blue-300 flex items-center justify-center font-black text-xs">
                    2FA
                  </div>
                  <h3 className="text-sm font-bold text-foreground dark:text-white">
                    Vinculación de Dispositivo
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelar}
                  className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl gap-1.5 font-semibold"
                >
                  <X className="size-3.5" />
                  Cancelar
                </Button>
              </div>

              {/* Sub-grid lado a lado: Paso 1 (QR) a la izquierda y Paso 2 (Código) a la derecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Paso 1: Escaneo de QR */}
                <div className="flex flex-col items-center text-center gap-2.5 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1A73E8] bg-blue-100/80 dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/30 px-3 py-0.5 rounded-full">
                    Paso 1: Escanear
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-200 font-medium leading-tight">
                    Apunta con la cámara de tu autenticador:
                  </p>

                  <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 inline-block my-0.5">
                    {qrCodeUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={qrCodeUrl}
                        alt="Código QR MFA"
                        width={170}
                        height={170}
                        className="rounded-lg mx-auto block select-none"
                      />
                    ) : (
                      <div className="size-40 rounded-xl border border-dashed flex flex-col items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                        <QrCode className="size-6 animate-pulse text-[#1A73E8] dark:text-blue-400" />
                        <span className="text-[10px] font-semibold">Generando QR…</span>
                      </div>
                    )}
                  </div>

                  {/* Acordeón de clave de respaldo compacta */}
                  <details className="w-full text-left bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 text-[11px]">
                    <summary className="font-semibold text-slate-600 dark:text-slate-200 cursor-pointer select-none hover:text-foreground dark:hover:text-white transition-colors text-center text-[11px]">
                      ¿No puedes escanear? Ver clave
                    </summary>
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-1.5">
                      <p className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                        Ingresa esta clave en tu app:
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="flex-1 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-2 py-1 text-center font-mono text-[10px] font-bold tracking-wider break-all rounded-lg select-all border border-slate-200 dark:border-slate-800">
                          {secreto}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={copiarClave}
                          className="h-7 px-2.5 rounded-lg shrink-0 text-[10px] font-bold dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {copiado ? <Check className="size-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-3" />}
                        </Button>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Paso 2: Verificación del código de 6 dígitos */}
                <div className="flex flex-col justify-between gap-4 h-full bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-500/20 dark:border dark:border-emerald-500/30 px-3 py-0.5 rounded-full w-fit">
                      Paso 2: Confirmar
                    </span>
                    <label
                      htmlFor="codigo-segundo"
                      className="text-xs font-bold text-foreground dark:text-white leading-tight"
                    >
                      Ingresa el código temporal de 6 dígitos que muestra tu app:
                    </label>

                    <Input
                      id="codigo-segundo"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="• • • • • •"
                      required
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="h-12 text-center font-mono text-2xl tracking-[0.3em] rounded-xl bg-white dark:bg-slate-900 text-foreground dark:text-white font-black shadow-inner border-slate-300 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />

                    <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium text-center">
                      El código se renueva automáticamente cada 30 segundos.
                    </p>

                    {error && (
                      <p className="text-destructive dark:text-red-300 text-xs font-semibold text-center bg-destructive/10 dark:bg-red-950/50 border border-destructive/20 dark:border-red-800/50 p-2 rounded-lg">
                        {error}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      type="submit"
                      disabled={cargando || codigo.length < 6}
                      className="h-11 text-sm font-bold rounded-xl bg-[#1D3987] hover:bg-[#152960] text-white dark:bg-blue-600 dark:hover:bg-blue-500 shadow-md transition-all w-full"
                    >
                      {cargando ? "Verificando..." : "Verificar y Activar"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelar}
                      className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* Vista inicial en reposo */
            <div className="flex flex-col gap-5 py-2">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-[#1D3987]/10 dark:bg-blue-500/20 text-[#1D3987] dark:text-blue-300 flex items-center justify-center shrink-0">
                  <Lock className="size-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-bold text-foreground dark:text-white">
                    Autenticación en Dos Pasos (TOTP)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200 font-medium leading-relaxed">
                    {tieneFactores
                      ? "Tu cuenta administrativa ya cuenta con un nivel de protección elevado. Puedes vincular un dispositivo adicional por si extravías o cambias de celular."
                      : "Refuerza la seguridad de la plataforma. Con 2FA activo, nadie podrá ingresar a tu panel de administración aunque conozca tu contraseña."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                  <p className="text-xs font-bold text-foreground dark:text-white">
                    {tieneFactores ? "Añadir dispositivo de respaldo" : "¿Listo para activar la protección?"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                    Configuración rápida escaneando el código QR con tu celular.
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={cargando}
                  onClick={() => void generar()}
                  className="h-10 px-5 rounded-xl font-bold bg-[#1D3987] hover:bg-[#152960] text-white dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm shrink-0 gap-2 text-xs sm:text-sm"
                >
                  {cargando ? (
                    "Generando..."
                  ) : (
                    <>
                      <span>{tieneFactores ? "Vincular nuevo dispositivo" : "Activar segundo factor"}</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <p className="text-destructive dark:text-red-300 text-xs font-semibold text-center bg-destructive/10 dark:bg-red-950/50 border border-destructive/20 dark:border-red-800/50 p-2 rounded-lg">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
