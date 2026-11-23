"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  HelpCircle,
  Lock,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { SelectorPaisTelefono } from "@/components/checkout/selector-pais-telefono";
import {
  iniciarCheckoutAction,
  validarCuponAction,
} from "@/server/checkout/acciones";
import { Turnstile } from "@marsidev/react-turnstile";

export type CheckoutCurso = {
  id: string;
  nombre: string;
  slug: string;
  precio_pen: number;
  precio_usd: number;
  imagen_url: string | null;
};

export function CheckoutFormulario({ curso }: { curso: CheckoutCurso }) {
  const router = useRouter();

  // Estados del formulario de contacto
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [correoConfirmacion, setCorreoConfirmacion] = useState("");
  const [pais, setPais] = useState("PE");
  const [telefono, setTelefono] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<"DNI" | "CE" | "PASAPORTE" | "RUC">("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState("");

  // Método de pago
  const [metodoPago, setMetodoPago] = useState<
    "mercadopago" | "yape" | "paypal" | "simulacion_dev"
  >("mercadopago");

  // Aceptación legal obligatoria (3.1)
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Protección Anti-Bots Turnstile (3.2)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

  // Cupones de descuento
  const [codigoCuponInput, setCodigoCuponInput] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<{
    codigo: string;
    porcentaje: number;
  } | null>(null);
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [mensajeCupon, setMensajeCupon] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  // Estados de proceso y errores
  const [procesando, setProcesando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // Cálculos de precio
  const subtotal = Number(curso.precio_pen);
  const porcentajeDescuento = cuponAplicado ? cuponAplicado.porcentaje : 0;
  const montoDescuento = Number(((subtotal * porcentajeDescuento) / 100).toFixed(2));
  const totalPagar = Number((subtotal - montoDescuento).toFixed(2));

  // Aplicar cupón
  const handleAplicarCupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeCupon(null);
    if (!codigoCuponInput.trim()) return;

    setValidandoCupon(true);
    try {
      const res = await validarCuponAction(codigoCuponInput, curso.id);
      if (res.ok) {
        setCuponAplicado({
          codigo: res.codigo,
          porcentaje: res.porcentaje,
        });
        setMensajeCupon({
          tipo: "exito",
          texto: `¡Cupón ${res.codigo} aplicado! Ahorraste un ${res.porcentaje}%.`,
        });
      } else {
        setCuponAplicado(null);
        setMensajeCupon({
          tipo: "error",
          texto: res.error,
        });
      }
    } catch {
      setMensajeCupon({
        tipo: "error",
        texto: "Error de conexión al validar el cupón.",
      });
    } finally {
      setValidandoCupon(false);
    }
  };

  // Quitar cupón
  const handleQuitarCupon = () => {
    setCuponAplicado(null);
    setCodigoCuponInput("");
    setMensajeCupon(null);
  };

  // Enviar orden de compra
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);

    // Validaciones
    if (correo.trim().toLowerCase() !== correoConfirmacion.trim().toLowerCase()) {
      setErrorGeneral("Los correos electrónicos ingresados no coinciden. Por favor verifícalos.");
      return;
    }

    if (!telefono.trim()) {
      setErrorGeneral("Por favor ingresa tu número de WhatsApp o teléfono.");
      return;
    }

    if (!aceptaTerminos) {
      setErrorGeneral(
        "Debes aceptar los Términos de servicio, Política de privacidad y Reembolsos para continuar con el pago."
      );
      return;
    }

    setProcesando(true);
    try {
      const res = await iniciarCheckoutAction({
        nombres,
        apellidos,
        correo,
        telefono,
        pais,
        tipoDocumento,
        numeroDocumento,
        cursoId: curso.id,
        codigoCupon: cuponAplicado?.codigo,
        metodoPago,
        aceptaTerminos,
        turnstileToken: turnstileToken ?? undefined,
      });

      if (!res.ok) {
        setErrorGeneral(res.error);
        setProcesando(false);
        return;
      }

      // Si fue una compra simulada de prueba o aprobada
      if (res.simulado) {
        router.push(
          `/checkout/gracias?orden=${res.ordenId}&num=${res.numeroOrden}&nombre=${encodeURIComponent(
            nombres
          )}&correo=${encodeURIComponent(correo)}`
        );
        return;
      }

      // Si tiene punto de inicio de Mercado Pago
      if (res.initPoint) {
        window.location.href = res.initPoint;
        return;
      }

      // Fallback
      router.push(
        `/checkout/gracias?orden=${res.ordenId}&num=${res.numeroOrden}&nombre=${encodeURIComponent(
          nombres
        )}&correo=${encodeURIComponent(correo)}`
      );
    } catch (err) {
      console.error(err);
      setErrorGeneral("Ocurrió un error inesperado al procesar la compra. Inténtalo de nuevo.");
      setProcesando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      {/* Columna Izquierda: Formulario de Pago (7 cols) */}
      <div className="lg:col-span-7">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {errorGeneral && (
            <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 border border-rose-200">
              <AlertCircle className="size-5 shrink-0" />
              <span>{errorGeneral}</span>
            </div>
          )}

          {/* Paso 1: Datos Personales */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center gap-3 border-b border-black/5 pb-4">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#1A73E8] text-xs font-black text-white">
                1
              </span>
              <h2 className="text-lg font-extrabold text-[#1F3A6E] sm:text-xl">
                Tus datos de contacto y acceso
              </h2>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Con estos datos se creará tu perfil en el aula virtual y te enviaremos tu comprobante de pago.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Nombres *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: María"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  className="h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Apellidos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Castillo"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Confirmar correo *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Confirma tu correo"
                  value={correoConfirmacion}
                  onChange={(e) => setCorreoConfirmacion(e.target.value)}
                  className="h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Teléfono / WhatsApp *
                </label>
                <SelectorPaisTelefono
                  paisSeleccionado={pais}
                  onCambiarPais={setPais}
                  valorTelefono={telefono}
                  onCambiarTelefono={setTelefono}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Documento de identidad
                </label>
                <div className="flex gap-2">
                  <select
                    value={tipoDocumento}
                    onChange={(e) =>
                      setTipoDocumento(
                        e.target.value as "DNI" | "CE" | "PASAPORTE" | "RUC"
                      )
                    }
                    className="h-11 rounded-xl border border-black/15 bg-white px-2.5 text-xs font-bold text-slate-700 outline-none transition-all focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">C.E.</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="RUC">RUC</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Número"
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    className="h-11 flex-1 rounded-xl border border-black/15 bg-white px-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Paso 2: Método de Pago */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center gap-3 border-b border-black/5 pb-4">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#1A73E8] text-xs font-black text-white">
                2
              </span>
              <h2 className="text-lg font-extrabold text-[#1F3A6E] sm:text-xl">
                Selecciona tu método de pago
              </h2>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {/* Opción 1: Tarjetas / Mercado Pago */}
              <label
                className={`relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all ${
                  metodoPago === "mercadopago"
                    ? "border-[#1A73E8] bg-blue-50/50 shadow-xs ring-2 ring-[#1A73E8]/20"
                    : "border-black/10 hover:border-black/20 hover:bg-slate-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="metodoPago"
                  value="mercadopago"
                  checked={metodoPago === "mercadopago"}
                  onChange={() => setMetodoPago("mercadopago")}
                  className="mt-1 size-4 text-[#1A73E8]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#1F3A6E] text-sm sm:text-base">
                      Tarjeta de Crédito / Débito
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                        VISA
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                        MC
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                        AMEX
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Procesado de forma segura y encriptada por Mercado Pago. Aprobación inmediata.
                  </p>
                </div>
              </label>

              {/* Opción 2: Yape / Plin */}
              <label
                className={`relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all ${
                  metodoPago === "yape"
                    ? "border-[#1A73E8] bg-blue-50/50 shadow-xs ring-2 ring-[#1A73E8]/20"
                    : "border-black/10 hover:border-black/20 hover:bg-slate-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="metodoPago"
                  value="yape"
                  checked={metodoPago === "yape"}
                  onChange={() => setMetodoPago("yape")}
                  className="mt-1 size-4 text-[#1A73E8]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#1F3A6E] text-sm sm:text-base">
                      Yape / Plin / PagoEfectivo
                    </span>
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700">
                      Billeteras Perú
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Paga escaneando código QR o generando tu código de pago bancario al instante.
                  </p>
                </div>
              </label>

              {/* Opción 3: PayPal */}
              <label
                className={`relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all ${
                  metodoPago === "paypal"
                    ? "border-[#1A73E8] bg-blue-50/50 shadow-xs ring-2 ring-[#1A73E8]/20"
                    : "border-black/10 hover:border-black/20 hover:bg-slate-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="metodoPago"
                  value="paypal"
                  checked={metodoPago === "paypal"}
                  onChange={() => setMetodoPago("paypal")}
                  className="mt-1 size-4 text-[#1A73E8]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#1F3A6E] text-sm sm:text-base">
                      PayPal (Internacional / USD)
                    </span>
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-extrabold text-sky-700">
                      ${curso.precio_usd} USD
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Ideal para pagos desde fuera de Perú con tu saldo PayPal o tarjetas internacionales.
                  </p>
                </div>
              </label>

              {/* Opción 4: Modo Simulación / Prueba Dev */}
              <label
                className={`relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all ${
                  metodoPago === "simulacion_dev"
                    ? "border-emerald-500 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20"
                    : "border-black/10 hover:border-emerald-300 hover:bg-emerald-50/20"
                }`}
              >
                <input
                  type="radio"
                  name="metodoPago"
                  value="simulacion_dev"
                  checked={metodoPago === "simulacion_dev"}
                  onChange={() => setMetodoPago("simulacion_dev")}
                  className="mt-1 size-4 text-emerald-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 text-sm sm:text-base flex items-center gap-1.5">
                      <Sparkles className="size-4 text-emerald-600" />
                      Modo Prueba Rápida (Simulación)
                    </span>
                    <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Dev Testing
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-700">
                    Aprueba el pedido inmediatamente y te registra en el aula virtual para probar todo el flujo sin realizar un pago real.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Casilla Obligatoria de Aceptación Legal (Punto 3.1) */}
          <div className="rounded-2xl border border-black/10 bg-slate-50/80 p-4 transition-all">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
              />
              <span className="text-xs text-slate-600 leading-relaxed select-none">
                He leído y acepto los{" "}
                <Link
                  href="/legal/terminos"
                  target="_blank"
                  className="font-bold text-[#1A73E8] underline hover:text-[#155fc0]"
                >
                  Términos de servicio
                </Link>
                , la{" "}
                <Link
                  href="/legal/privacidad"
                  target="_blank"
                  className="font-bold text-[#1A73E8] underline hover:text-[#155fc0]"
                >
                  Política de privacidad
                </Link>{" "}
                y la{" "}
                <Link
                  href="/legal/reembolsos"
                  target="_blank"
                  className="font-bold text-[#1A73E8] underline hover:text-[#155fc0]"
                >
                  Política de reembolsos
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Cloudflare Turnstile Anti-Bots (3.2) */}
          {turnstileSiteKey && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-black/10 bg-slate-50/75 p-3.5 sm:items-start">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <ShieldCheck className="size-4 text-[#1A73E8]" />
                <span>Protección anti-robots de Cloudflare:</span>
              </div>
              <div className="overflow-hidden rounded-xl">
                <Turnstile
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => {
                    console.warn("[Turnstile] Widget error");
                    setTurnstileToken(null);
                  }}
                  onExpire={() => setTurnstileToken(null)}
                  options={{
                    theme: "light",
                    size: "normal",
                  }}
                />
              </div>
            </div>
          )}

          {/* Botón de Pago Principal (en móvil) */}
          <div className="lg:hidden">
            <button
              type="submit"
              disabled={procesando}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1A73E8] px-6 text-lg font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-[#155fc0] active:scale-[0.99] disabled:opacity-50"
            >
              <Lock className="size-5" />
              <span>
                {procesando
                  ? "Procesando pago seguro..."
                  : `Pagar S/ ${totalPagar.toFixed(2)}`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Columna Derecha: Resumen del Pedido (5 cols sticky) */}
      <div className="lg:col-span-5 lg:sticky lg:top-8">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-7">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resumen de tu pedido
          </h3>

          {/* Info del Curso */}
          <div className="mt-4 flex gap-4 border-b border-black/5 pb-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#1e3a8a] text-white shadow-inner">
              <Sparkles className="size-8" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#1F3A6E] text-base leading-snug">
                {curso.nombre}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Curso completo online · Acceso por 12 meses
              </p>
            </div>
          </div>

          {/* Beneficios incluidos */}
          <div className="mt-5 flex flex-col gap-2.5 border-b border-black/5 pb-5 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Acceso total por 1 año a las 10 lecciones HD</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Mentoría y consultas directas por WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Certificado oficial al culminar el curso</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Plantilla de cotización de eventos descargable</span>
            </div>
          </div>

          {/* Sección de Cupón de Descuento */}
          <div className="mt-5 border-b border-black/5 pb-5">
            {cuponAplicado ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 border border-emerald-200">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Gift className="size-4 text-emerald-600" />
                  <span>Cupón {cuponAplicado.codigo} (-{cuponAplicado.porcentaje}%)</span>
                </div>
                <button
                  type="button"
                  onClick={handleQuitarCupon}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <form onSubmit={handleAplicarCupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="¿Tienes un cupón?"
                  value={codigoCuponInput}
                  onChange={(e) => setCodigoCuponInput(e.target.value.toUpperCase())}
                  className="h-10 flex-1 rounded-xl border border-black/15 bg-white px-3 text-xs font-mono uppercase text-slate-900 outline-none focus:border-[#1A73E8]"
                />
                <button
                  type="submit"
                  disabled={validandoCupon || !codigoCuponInput.trim()}
                  className="h-10 rounded-xl bg-[#1F3A6E] px-4 text-xs font-bold text-white transition-colors hover:bg-[#16294f] disabled:opacity-50"
                >
                  {validandoCupon ? "..." : "Aplicar"}
                </button>
              </form>
            )}

            {mensajeCupon && (
              <p
                className={`mt-2 text-xs font-semibold ${
                  mensajeCupon.tipo === "exito" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {mensajeCupon.texto}
              </p>
            )}
          </div>

          {/* Desglose Financiero */}
          <div className="mt-5 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-slate-500 text-xs">
              <span>Precio regular</span>
              <span className="line-through">S/ 250.00</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Precio promocional</span>
              <span className="font-semibold">S/ {subtotal.toFixed(2)}</span>
            </div>
            {montoDescuento > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Descuento de cupón</span>
                <span>-S/ {montoDescuento.toFixed(2)}</span>
              </div>
            )}
            <div className="mt-2 flex items-baseline justify-between border-t border-black/10 pt-3">
              <span className="text-base font-extrabold text-[#1F3A6E]">
                Total a pagar
              </span>
              <span className="text-2xl font-black text-[#1A73E8]">
                S/ {totalPagar.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Botón de Pago Principal (en Desktop) */}
          <div className="mt-6 hidden lg:block">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={procesando}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1A73E8] px-6 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-[#155fc0] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <Lock className="size-4" />
              <span>
                {procesando
                  ? "Procesando pago seguro..."
                  : `Pagar S/ ${totalPagar.toFixed(2)}`}
              </span>
            </button>
          </div>

          {/* Sellos de Seguridad */}
          <div className="mt-6 flex flex-col gap-2.5 border-t border-black/5 pt-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#1A73E8]" />
              <span>Garantía incondicional de 7 días o tu dinero de vuelta</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-emerald-600" />
              <span>Pago encriptado de 256 bits y 100% seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-amber-500" />
              <span>Activación inmediata de tu cuenta tras el pago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
