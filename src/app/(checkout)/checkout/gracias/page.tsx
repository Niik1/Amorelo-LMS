import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Mail,
  KeyRound,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { confirmarPagoRetornoMP } from "@/server/checkout/acciones";

export const metadata: Metadata = {
  title: "¡Compra Confirmada! | Amorelo",
  description: "Gracias por tu compra. Revisa tu correo para activar tu contraseña y acceder al aula virtual.",
};

function obtenerInfoProveedor(correo: string) {
  const dominio = correo.split("@")[1]?.toLowerCase() || "";

  if (dominio.includes("gmail.com") || dominio.includes("googlemail.com")) {
    return {
      nombre: "Gmail",
      url: "https://mail.google.com/mail/u/0/#inbox",
      etiquetaBoton: "Abrir mi Gmail",
    };
  }

  if (
    dominio.includes("outlook.com") ||
    dominio.includes("hotmail.com") ||
    dominio.includes("live.com") ||
    dominio.includes("msn.com")
  ) {
    return {
      nombre: "Outlook / Hotmail",
      url: "https://outlook.live.com/mail/0/",
      etiquetaBoton: "Abrir mi Outlook / Hotmail",
    };
  }

  if (dominio.includes("yahoo.com")) {
    return {
      nombre: "Yahoo Mail",
      url: "https://mail.yahoo.com",
      etiquetaBoton: "Abrir mi Yahoo Mail",
    };
  }

  if (dominio.includes("icloud.com")) {
    return {
      nombre: "iCloud Mail",
      url: "https://www.icloud.com/mail",
      etiquetaBoton: "Abrir mi iCloud Mail",
    };
  }

  return {
    nombre: "Bandeja de entrada",
    url: `mailto:${correo}`,
    etiquetaBoton: "Abrir mi correo",
  };
}

// Control manual: cambiar a true cuando el negocio cuente con RUC 20 para activar pasarela
const PASARELA_ACTIVA = false;

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{
    orden?: string;
    num?: string;
    nombre?: string;
    correo?: string;
    collection_status?: string;
    status?: string;
    payment_id?: string;
    collection_id?: string;
    external_reference?: string;
  }>;
}) {
  if (!PASARELA_ACTIVA) {
    redirect("/");
  }

  const params = await searchParams;
  const ordenId = params.orden || params.external_reference;
  const isApproved =
    params.collection_status === "approved" || params.status === "approved";

  let nombre = params.nombre || "Alumna";
  let numOrden = params.num || "ORD-COMPRA";
  let correo = params.correo || "tu correo";

  // Si proviene de un retorno de Mercado Pago aprobado
  if (ordenId && isApproved) {
    const info = await confirmarPagoRetornoMP(
      ordenId,
      params.payment_id || params.collection_id
    );
    if (info) {
      nombre = info.nombre;
      numOrden = info.numeroOrden;
      correo = info.correo;
    }
  }

  const proveedor = obtenerInfoProveedor(correo);

  return (
    <div className="mx-auto max-w-2xl py-6 text-center sm:py-10">
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-xs sm:p-12">
        {/* Ícono de Celebración */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
          <CheckCircle2 className="size-12" />
        </div>

        <div className="mt-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <Sparkles className="size-3.5" /> Pago Aprobado con Éxito
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-black text-[#1F3A6E] sm:text-3xl">
          ¡Felicitaciones, {nombre}!
        </h1>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Tu pedido <strong className="font-mono text-slate-800">{numOrden}</strong> se procesó correctamente.
          Hemos enviado tus credenciales de acceso a:
        </p>

        {/* Pill del correo del alumno */}
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 border border-blue-200/80 text-xs sm:text-sm font-bold text-[#1A73E8]">
          <Mail className="size-4 shrink-0" />
          <span>{correo}</span>
        </div>

        {/* Pasos guiados 1, 2 y 3 */}
        <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-slate-50 p-5 text-left text-xs sm:text-sm border border-black/5">
          <div className="flex items-start gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-xs font-extrabold text-white">
              1
            </div>
            <div>
              <p className="font-bold text-slate-800">Abre tu correo</p>
              <p className="text-slate-500 mt-0.5">
                Pulsa el botón azul de abajo para abrir directamente tu bandeja en {proveedor.nombre}.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-xs font-extrabold text-white">
              2
            </div>
            <div>
              <p className="font-bold text-slate-800">Crea tu contraseña personal</p>
              <p className="text-slate-500 mt-0.5">
                Abre el mensaje de Amorelo y pulsa en el botón seguro de acceso para definir tu contraseña.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-xs font-extrabold text-white">
              3
            </div>
            <div>
              <p className="font-bold text-slate-800">¡Comienza tu primera clase!</p>
              <p className="text-slate-500 mt-0.5">
                Ingresa al Aula Virtual para ver los 4 módulos completos y solicitar tu mentoría WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Botón Principal: Smart Inbox Redirect */}
        <div className="mt-8 flex flex-col gap-3">
          <a
            href={proveedor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#1A73E8] px-6 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-[#155fc0] active:scale-[0.99]"
          >
            <Mail className="size-5" />
            <span>{proveedor.etiquetaBoton}</span>
            <ExternalLink className="size-4 opacity-80" />
          </a>

          {/* Enlace sutil para quien ya configuró su clave */}
          <p className="mt-2 text-xs text-slate-500">
            ¿Ya creaste tu contraseña?{" "}
            <Link
              href="/login"
              className="font-bold text-[#1A73E8] hover:underline"
            >
              Iniciar sesión en el Aula Virtual aquí
            </Link>
          </p>
        </div>

        {/* Soporte WhatsApp por si no encuentra el correo */}
        <div className="mt-8 border-t border-black/5 pt-5">
          <p className="text-xs text-slate-500">
            ¿No encuentras el correo o tienes dudas con tu acceso?
          </p>
          <a
            href={`https://wa.me/51945729551?text=Hola,%20acabo%20de%20comprar%20el%20curso%20con%20el%20correo%20${encodeURIComponent(
              correo
            )}%20y%20necesito%20ayuda%20para%20ingresar.`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            <MessageCircle className="size-4 text-emerald-600" />
            <span>Escríbenos directamente a WhatsApp</span>
          </a>
        </div>

        <div className="mt-6 border-t border-black/5 pt-4">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}
