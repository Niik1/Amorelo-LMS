"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Globe,
  ImageIcon,
  Info,
  Loader2,
  Mail,
  MessageSquare,
  Percent,
  Phone,
  Save,
  ShieldAlert,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  esquemaConfiguracionComprobante,
  type EntradaConfiguracionComprobante,
} from "@/lib/validators/configuracion";
import {
  guardarConfiguracionComprobanteAction,
  subirLogoComprobanteAction,
} from "@/server/configuracion/acciones";
import { PrevisualizadorComprobante } from "./previsualizador-comprobante";
import { CargaMultimediaOverlay } from "@/components/admin/shared/carga-multimedia-overlay";
import { cn } from "@/lib/utils";

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-destructive mt-1 text-xs font-semibold">{mensaje}</p>;
}

interface ConfiguracionComprobantesFormProps {
  configuracionInicial: EntradaConfiguracionComprobante;
}

/**
 * Optimiza y convierte cualquier imagen (PNG, JPG, JPEG, WebP) a PNG en el navegador,
 * redimensionándola a un ancho máximo adecuado y conservando la transparencia alfa.
 * Se guarda en PNG para máxima compatibilidad con el motor de PDF (que requiere PNG/JPG).
 */
async function optimizarLogoAPNG(
  file: File,
  maxAncho = 800
): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let ancho = img.naturalWidth || img.width;
      let alto = img.naturalHeight || img.height;

      if (ancho > maxAncho) {
        alto = Math.round((alto * maxAncho) / ancho);
        ancho = maxAncho;
      }

      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;

      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);

      // Conservar transparencia alfa sin rellenar fondo
      ctx.clearRect(0, 0, ancho, alto);
      ctx.drawImage(img, 0, 0, ancho, alto);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const nombreBase = file.name
            .replace(/\.[^/.]+$/, "")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "_");
          const pngFile = new File([blob], `${nombreBase}.png`, {
            type: "image/png",
          });
          resolve(pngFile);
        },
        "image/png"
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

function extraerDigitosTelefono(tel?: string | null): string {
  if (!tel) return "";
  const soloNum = tel.replace(/\D/g, "");
  if (soloNum.startsWith("51") && soloNum.length > 9) {
    return soloNum.slice(2, 11);
  }
  return soloNum.slice(0, 9);
}

export function ConfiguracionComprobantesForm({
  configuracionInicial,
}: ConfiguracionComprobantesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [progresoSubidaLogo, setProgresoSubidaLogo] = useState<number | undefined>(undefined);
  const [mensajeSubidaLogo, setMensajeSubidaLogo] = useState<string>("");
  const [telefonoDigitos, setTelefonoDigitos] = useState(() =>
    extraerDigitosTelefono(configuracionInicial.telefono)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<EntradaConfiguracionComprobante>({
    resolver: zodResolver(esquemaConfiguracionComprobante),
    defaultValues: configuracionInicial,
  });

  // Observar valores en tiempo real para alimentar la previsualización
  const datosVivos = useWatch({ control });
  const configuracionActual: EntradaConfiguracionComprobante = {
    ...configuracionInicial,
    ...datosVivos,
  };

  const handleSubirLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoLogo(true);
    setProgresoSubidaLogo(20);
    setMensajeSubidaLogo("Optimizando logo en PNG de alta resolución...");
    let progresoTimer: NodeJS.Timeout | null = null;

    try {
      // 1. Optimizar y convertir automáticamente a PNG (con transparencia alfa) antes de subir
      const archivoPng = await optimizarLogoAPNG(file);

      setProgresoSubidaLogo(45);
      setMensajeSubidaLogo("Subiendo logo oficial a la nube...");

      progresoTimer = setInterval(() => {
        setProgresoSubidaLogo((prev) => {
          if (prev === undefined || prev >= 88) return prev;
          return prev + 8;
        });
      }, 250);

      const formData = new FormData();
      formData.append("logo", archivoPng);
      if (configuracionActual.logo_url) {
        formData.append("logoAnteriorUrl", configuracionActual.logo_url);
      }

      const res = await subirLogoComprobanteAction(formData);
      if (progresoTimer) clearInterval(progresoTimer);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      setProgresoSubidaLogo(100);
      setMensajeSubidaLogo("¡Logo subido con éxito!");

      setValue("logo_url", res.url, { shouldValidate: true });
      toast.success("Logo optimizado y subido correctamente.");
    } catch {
      toast.error("Error al optimizar y subir el logo. Intenta de nuevo.");
    } finally {
      if (progresoTimer) clearInterval(progresoTimer);
      setTimeout(() => {
        setSubiendoLogo(false);
        setProgresoSubidaLogo(undefined);
        setMensajeSubidaLogo("");
      }, 450);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = (datos: EntradaConfiguracionComprobante) => {
    startTransition(async () => {
      const res = await guardarConfiguracionComprobanteAction(datos);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Configuración de comprobantes guardada correctamente.");
    });
  };

  const onError = () => {
    toast.error("Por favor completa los campos marcados en rojo.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} noValidate className="w-full">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ========================================================
            COLUMNA IZQUIERDA: Formulario de Parámetros (7 cols)
            ======================================================== */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Bloque 1: Identidad Visual y Logo */}
          <Card className="rounded-3xl border border-black/10 shadow-xs dark:border-white/10 dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                  <ImageIcon className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Identidad Visual y Logo
                  </CardTitle>
                  <CardDescription className="text-xs">
                    El logo que aparecerá en la cabecera de las boletas A4 y tickets.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Visualizador del logo actual */}
                <div className="relative size-28 shrink-0 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                  {configuracionActual.logo_url ? (
                    <Image
                      src={configuracionActual.logo_url}
                      alt="Logo de Comprobante"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <ImageIcon className="size-8 mx-auto mb-1 opacity-60" />
                      <span className="text-[10px] block font-semibold">Sin logo</span>
                    </div>
                  )}

                  <CargaMultimediaOverlay
                    cargando={subiendoLogo}
                    progreso={progresoSubidaLogo}
                    mensaje={mensajeSubidaLogo}
                    tipo="imagen"
                  />
                </div>

                {/* Acciones de subida */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    disabled={subiendoLogo}
                    onChange={handleSubirLogo}
                  />

                  <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                    <Button
                      type="button"
                      disabled={subiendoLogo}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-11 px-5 rounded-2xl font-bold bg-[#1D3987] hover:bg-[#152960] text-white shadow-sm transition-all gap-2 cursor-pointer dark:bg-white dark:text-[#1D3987] dark:hover:bg-slate-100"
                    >
                      {subiendoLogo ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Optimizando y subiendo…</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="size-4" />
                          <span>
                            {configuracionActual.logo_url
                              ? "Cambiar logo oficial"
                              : "Subir logo oficial"}
                          </span>
                        </>
                      )}
                    </Button>

                    {configuracionActual.logo_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue("logo_url", null, { shouldValidate: true })}
                        className="h-11 px-4 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/40 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 className="size-3.5 mr-1.5" />
                        Quitar
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Formatos recomendados: PNG o JPG con fondo transparente (se optimiza automáticamente para PDF y web).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bloque 2: Datos del Emisor y Cabecera */}
          <Card className="rounded-3xl border border-black/10 shadow-xs dark:border-white/10 dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Datos del Emisor y Cabecera
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Información legal y comercial que encabeza cada comprobante.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="razon_social" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Razón Social / Nombre Principal *
                </Label>
                <Input
                  id="razon_social"
                  {...register("razon_social")}
                  placeholder="Ej. AMORELO"
                  className={cn(
                    "mt-1.5 rounded-xl h-11",
                    errors.razon_social && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-invalid={Boolean(errors.razon_social)}
                />
                <ErrorCampo mensaje={errors.razon_social?.message} />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="nombre_comercial" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nombre Comercial / Subtítulo
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {configuracionActual.nombre_comercial?.length ?? 0}/150
                  </span>
                </div>
                <Textarea
                  id="nombre_comercial"
                  {...register("nombre_comercial")}
                  rows={2}
                  placeholder="Ej. Academia de Arte y Globos"
                  className={cn(
                    "rounded-xl text-xs resize-none",
                    errors.nombre_comercial && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-invalid={Boolean(errors.nombre_comercial)}
                />
                <ErrorCampo mensaje={errors.nombre_comercial?.message} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="ruc" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    RUC (11 dígitos) *
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {configuracionActual.ruc?.length ?? 0}/11
                  </span>
                </div>
                <Input
                  id="ruc"
                  inputMode="numeric"
                  maxLength={11}
                  {...register("ruc", {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
                    },
                  })}
                  placeholder="Ej. 20609234561"
                  className={cn(
                    "rounded-xl h-11 font-mono tracking-wider",
                    errors.ruc && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-invalid={Boolean(errors.ruc)}
                />
                <ErrorCampo mensaje={errors.ruc?.message} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="direccion" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dirección Fiscal o Ubicación
                  </Label>
                </div>
                <Input
                  id="direccion"
                  {...register("direccion")}
                  placeholder="Ej. Lima, Perú"
                  className={cn(
                    "rounded-xl h-11",
                    errors.direccion && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-invalid={Boolean(errors.direccion)}
                />
                <ErrorCampo mensaje={errors.direccion?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Bloque 3: Canales de Contacto en Comprobante */}
          <Card className="rounded-3xl border border-black/10 shadow-xs dark:border-white/10 dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                  <Phone className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Canales de Contacto en Comprobante
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Teléfonos y enlaces para que los alumnos verifiquen o consulten su compra.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="telefono" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    WhatsApp / Teléfono *
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {telefonoDigitos.length}/9
                  </span>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-full rounded-xl border bg-background overflow-hidden transition-colors focus-within:ring-3",
                    errors.telefono
                      ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/30"
                      : "border-input focus-within:border-primary focus-within:ring-primary/20"
                  )}
                >
                  <div className="flex items-center gap-1.5 bg-muted/60 border-r border-input px-3 text-xs font-bold text-foreground shrink-0 select-none">
                    <span className="text-base leading-none">🇵🇪</span>
                    <span className="font-mono text-xs">+51</span>
                  </div>
                  <input
                    id="telefono"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="924 353 798"
                    value={telefonoDigitos}
                    onChange={(e) => {
                      const soloNum = e.target.value.replace(/\D/g, "").slice(0, 9);
                      setTelefonoDigitos(soloNum);
                      setValue("telefono", soloNum ? `+51 ${soloNum}` : "", {
                        shouldValidate: true,
                      });
                    }}
                    className="flex-1 h-full bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono"
                    aria-invalid={Boolean(errors.telefono)}
                  />
                </div>
                <input type="hidden" {...register("telefono")} />
                <ErrorCampo mensaje={errors.telefono?.message} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="correo" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Correo Electrónico *
                  </Label>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="correo"
                    type="email"
                    {...register("correo")}
                    placeholder="contacto@amorelo.com"
                    className={cn(
                      "pl-10 rounded-xl h-11",
                      errors.correo && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    aria-invalid={Boolean(errors.correo)}
                  />
                </div>
                <ErrorCampo mensaje={errors.correo?.message} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="sitio_web" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Sitio Web *
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Inicia con www
                  </span>
                </div>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="sitio_web"
                    {...register("sitio_web")}
                    placeholder="www.amorelo.com"
                    className={cn(
                      "pl-10 rounded-xl h-11",
                      errors.sitio_web && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    aria-invalid={Boolean(errors.sitio_web)}
                  />
                </div>
                <ErrorCampo mensaje={errors.sitio_web?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Bloque 4: Configuración Tributaria e IGV */}
          <Card className="rounded-3xl border border-black/10 shadow-xs dark:border-white/10 dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                  <Percent className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Tratamiento de IGV (Perú)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define cómo se calculan el subtotal y el IGV en los comprobantes.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Régimen de Imposición de IGV
                </Label>
                <Select
                  value={configuracionActual.tratamiento_igv || "exonerado"}
                  onValueChange={(val) => {
                    if (val === "exonerado" || val === "incluido") {
                      setValue("tratamiento_igv", val, { shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger className="mt-1.5 h-11 w-full rounded-xl">
                    <SelectValue placeholder="Selecciona el tratamiento" />
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    className="rounded-2xl min-w-[340px] sm:min-w-[480px] p-1.5 shadow-xl"
                  >
                    <SelectItem value="exonerado" className="py-2.5 rounded-xl cursor-pointer">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-xs sm:text-sm text-foreground">
                          Exonerado de IGV (0%)
                        </span>
                        <span className="text-[11px] text-muted-foreground whitespace-normal">
                          Educación / Cursos y Control Interno (Subtotal = Total)
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="incluido" className="py-2.5 rounded-xl cursor-pointer">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-xs sm:text-sm text-foreground">
                          Precios Incluyen IGV (18%)
                        </span>
                        <span className="text-[11px] text-muted-foreground whitespace-normal">
                          Desglosar Base Imponible e Impuesto en el comprobante
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {configuracionActual.tratamiento_igv === "exonerado"
                    ? "Subtotal = Monto Total. El IGV se emite en S/ 0.00 como operación exonerada."
                    : "El precio cobrado ya contiene el 18%. Se calcula la base imponible y el IGV correspondiente."}
                </p>
                <ErrorCampo mensaje={errors.tratamiento_igv?.message} />
              </div>

              <div>
                <Label htmlFor="porcentaje_igv" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tasa de IGV (%)
                </Label>
                <Input
                  id="porcentaje_igv"
                  type="number"
                  disabled={configuracionActual.tratamiento_igv === "exonerado"}
                  {...register("porcentaje_igv", { valueAsNumber: true })}
                  className={cn(
                    "mt-1.5 rounded-xl h-11",
                    errors.porcentaje_igv && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-invalid={Boolean(errors.porcentaje_igv)}
                />
                <ErrorCampo mensaje={errors.porcentaje_igv?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Bloque 5: Mensajes y Leyenda Legal */}
          <Card className="rounded-3xl border border-black/10 shadow-xs dark:border-white/10 dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400">
                  <MessageSquare className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Mensajes y Leyenda Legal
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Notas de agradecimiento al cliente y aclaración de control administrativo.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="mensaje_agradecimiento" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mensaje Personalizado de Agradecimiento
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {configuracionActual.mensaje_agradecimiento?.length ?? 0}/250
                  </span>
                </div>
                <Textarea
                  id="mensaje_agradecimiento"
                  {...register("mensaje_agradecimiento")}
                  rows={2}
                  placeholder="Ej. ¡Gracias por tu compra y bienvenido a la academia Amorelo!"
                  className={cn(
                    "rounded-xl text-xs resize-none",
                    errors.mensaje_agradecimiento && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-invalid={Boolean(errors.mensaje_agradecimiento)}
                />
                <ErrorCampo mensaje={errors.mensaje_agradecimiento?.message} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="pie_comprobante" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Leyenda Legal de Control Interno (Pie de página)
                    </Label>
                    <Info className="size-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {configuracionActual.pie_comprobante?.length ?? 0}/500
                  </span>
                </div>
                <Textarea
                  id="pie_comprobante"
                  {...register("pie_comprobante")}
                  rows={3}
                  className={cn(
                    "rounded-xl text-xs resize-none font-sans",
                    errors.pie_comprobante && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-invalid={Boolean(errors.pie_comprobante)}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Protege legalmente a la empresa mientras no se emitan facturas con RUC 20 oficial a SUNAT.
                </p>
                <ErrorCampo mensaje={errors.pie_comprobante?.message} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================
            COLUMNA DERECHA: Previsualizador Dual Sticky (5 cols)
            ======================================================== */}
        <div className="xl:col-span-5 sticky top-6 flex flex-col gap-4">
          <PrevisualizadorComprobante datos={configuracionActual} />

          {/* Botón Guardar Configuración debajo del Preview (ancho reducido y centrado) */}
          <div className="flex justify-center pt-1">
            <Button
              type="submit"
              disabled={isPending}
              className="h-12 px-8 w-auto rounded-2xl font-bold bg-[#1D3987] hover:bg-[#152960] text-white shadow-md transition-all gap-2 cursor-pointer dark:bg-white dark:text-[#1D3987] dark:hover:bg-slate-100"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Guardando configuración…</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>Guardar configuración de comprobantes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
