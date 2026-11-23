"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sparkles,
  BookOpen,
  UploadCloud,
  Loader2,
  ImageIcon,
  X,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { crearCurso, subirArchivoStorage } from "@/server/cursos/acciones";
import {
  SimuladorGananciaPrecios,
  type CuponSimple,
} from "./simulador-ganancia-precios";
import { CargaMultimediaOverlay } from "@/components/admin/shared/carga-multimedia-overlay";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-destructive mt-1 text-xs font-semibold">{mensaje}</p>;
}

function generarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Optimiza y convierte cualquier imagen (PNG, JPG, etc.) a WebP liviano
 * en memoria usando Canvas nativo antes de enviarlo a Supabase Storage.
 */
async function optimizarImagenAWebP(
  file: File,
  maxAncho = 1280,
  calidad = 0.82
): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const img = new Image();
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

      // Fondo neutro blanco por si la imagen tiene transparencias y se pasa a WebP opaco
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, ancho, alto);
      ctx.drawImage(img, 0, 0, ancho, alto);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const nombreBase = file.name
            .replace(/\.[^/.]+$/, "")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "_");
          const webpFile = new File([blob], `${nombreBase}.webp`, {
            type: "image/webp",
          });
          resolve(webpFile);
        },
        "image/webp",
        calidad
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export function ModalCrearCurso({
  cupones = [],
}: {
  cupones?: CuponSimple[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState<number | undefined>(undefined);
  const [mensajeSubida, setMensajeSubida] = useState<string>("");
  const [cargandoPreviewUrl, setCargandoPreviewUrl] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [precioPen, setPrecioPen] = useState("");
  const [precioUsd, setPrecioUsd] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [activo, setActivo] = useState<"true" | "false">("true");

  const handleNombreChange = (val: string) => {
    setNombre(val);
    if (errores.nombre) {
      setErrores((prev) => {
        const copy = { ...prev };
        delete copy.nombre;
        return copy;
      });
    }
    // Si no lo editó manualmente o si el slug está vacío, autocompletar en tiempo real
    if (!slugEditadoManualmente || slug.trim() === "") {
      const nuevoSlug = generarSlug(val);
      setSlug(nuevoSlug);
      if (errores.slug && nuevoSlug.trim().length >= 3) {
        setErrores((prev) => {
          const copy = { ...prev };
          delete copy.slug;
          return copy;
        });
      }
    }
  };

  const handleRegenerarSlug = () => {
    const nuevoSlug = generarSlug(nombre);
    setSlug(nuevoSlug);
    setSlugEditadoManualmente(false);
    if (errores.slug && nuevoSlug.trim().length >= 3) {
      setErrores((prev) => {
        const copy = { ...prev };
        delete copy.slug;
        return copy;
      });
    }
    toast.success("Slug sincronizado con el nombre del curso.");
  };

  const handleSubirImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoImagen(true);
    setProgresoSubida(20);
    setMensajeSubida("Optimizando y convirtiendo a WebP...");
    let progresoTimer: NodeJS.Timeout | null = null;

    try {
      // 1. Optimizar imagen en el cliente a WebP (~80-120 KB)
      const archivoWebP = await optimizarImagenAWebP(file);
      const kbOriginal = Math.round(file.size / 1024);
      const kbWebP = Math.round(archivoWebP.size / 1024);

      setProgresoSubida(45);
      setMensajeSubida("Subiendo imagen a la nube...");

      // Simulación de avance suave durante la subida a Supabase
      progresoTimer = setInterval(() => {
        setProgresoSubida((prev) => {
          if (prev === undefined || prev >= 88) return prev;
          return prev + 8;
        });
      }, 250);

      // 2. Subir a Supabase Storage (bucket público 'marca')
      const formData = new FormData();
      formData.append("archivo", archivoWebP);
      formData.append("bucket", "marca");
      if (imagenUrl) {
        formData.append("archivoAnteriorUrl", imagenUrl);
      }

      const res = await subirArchivoStorage(formData);
      if (progresoTimer) clearInterval(progresoTimer);

      if (!res.ok) {
        toast.error(res.error || "No se pudo subir la imagen.");
        return;
      }

      setProgresoSubida(100);
      setMensajeSubida("¡Portada optimizada y lista!");

      if (res.url) {
        setImagenUrl(res.url);
        toast.success(
          `Portada optimizada a WebP (${kbWebP} KB vs ${kbOriginal} KB original) y guardada.`
        );
      }
    } catch {
      toast.error("Ocurrió un error al procesar y subir la portada.");
    } finally {
      if (progresoTimer) clearInterval(progresoTimer);
      setTimeout(() => {
        setSubiendoImagen(false);
        setProgresoSubida(undefined);
        setMensajeSubida("");
      }, 450);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const limpiar = () => {
    setNombre("");
    setSlug("");
    setSlugEditadoManualmente(false);
    setDescripcion("");
    setPrecioPen("");
    setPrecioUsd("");
    setImagenUrl("");
    setActivo("true");
    setErrores({});
  };

  const validarFormulario = (): boolean => {
    const nuevos: Record<string, string> = {};

    if (!nombre.trim()) {
      nuevos.nombre = "Ingresa el nombre del curso";
    } else if (nombre.trim().length < 3) {
      nuevos.nombre = "El nombre debe tener al menos 3 caracteres";
    } else if (nombre.trim().length > 120) {
      nuevos.nombre = "El nombre no puede exceder 120 caracteres";
    }

    if (!slug.trim()) {
      nuevos.slug = "Ingresa el slug (identificador URL)";
    } else if (slug.trim().length < 3) {
      nuevos.slug = "El slug debe tener al menos 3 caracteres";
    } else if (!/^[a-z0-9-]+$/.test(slug.trim())) {
      nuevos.slug = "Solo letras minúsculas, números y guiones (ej. curso-reposteria)";
    }

    if (precioPen.trim() === "") {
      nuevos.precioPen = "Ingresa el precio regular en soles";
    } else {
      const pen = parseFloat(precioPen);
      if (isNaN(pen) || pen < 0) {
        nuevos.precioPen = "Ingresa un precio válido (mayor o igual a 0)";
      }
    }

    if (precioUsd.trim() !== "") {
      const usd = parseFloat(precioUsd);
      if (isNaN(usd) || usd < 0) {
        nuevos.precioUsd = "Ingresa un precio en dólares válido";
      }
    }

    if (descripcion.trim().length > 600) {
      nuevos.descripcion = "La descripción no puede exceder 600 caracteres";
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast.error("Por favor completa los campos marcados en rojo.");
      return;
    }

    const pen = parseFloat(precioPen);
    const usd = precioUsd.trim() ? parseFloat(precioUsd) : null;

    setGuardando(true);
    try {
      const res = await crearCurso({
        nombre: nombre.trim(),
        slug: slug.trim(),
        descripcion: descripcion.trim() || undefined,
        precio_pen: pen,
        precio_usd: usd,
        imagen_url: imagenUrl.trim() || undefined,
        activo: activo === "true",
      });

      if (!res.ok) {
        if (res.error?.toLowerCase().includes("slug")) {
          setErrores((prev) => ({
            ...prev,
            slug: "Ya existe un curso con este slug. Elige otro.",
          }));
        }
        toast.error(res.error || "Error al crear el curso.");
        return;
      }

      toast.success("¡Curso creado con éxito!");
      setAbierto(false);
      limpiar();

      if ("id" in res && res.id) {
        router.push(`/panel-admin/cursos/${res.id}`);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Ocurrió un error inesperado al guardar el curso.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v);
        if (!v) limpiar();
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            className="rounded-full bg-white font-bold text-[#1e3a8a] shadow-sm hover:bg-slate-100 cursor-pointer"
          >
            <Plus className="mr-1.5 size-4" />
            <span>Crear Nuevo Curso</span>
          </Button>
        }
      />

      <DialogContent className="w-[96vw] max-w-[1440px] sm:max-w-7xl 2xl:max-w-[1480px] p-0 gap-0 overflow-hidden flex flex-col max-h-[92vh] h-auto">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Cabecera Fija */}
          <DialogHeader className="shrink-0 border-b px-5 sm:px-6 py-3 sm:py-4 bg-card">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-icon-accent mb-0.5">
              <BookOpen className="size-4" />
              <span>Catálogo de Formación Digital</span>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black text-heading tracking-tight">
              Crear Nuevo Curso
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Completa los datos del programa, sube la portada y simula el margen neto con cupones antes de publicarlo.
            </DialogDescription>
          </DialogHeader>

          {/* Cuerpo en 3 Columnas: Scrolleable suavemente si la altura de pantalla no alcanza */}
          <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 p-4 sm:p-5 lg:p-5">
            {/* Columna 1 (4 cols): Datos del Curso */}
            <div className="lg:col-span-4 space-y-3 sm:space-y-3.5">
              {/* Nombre */}
              <div>
                <Label htmlFor="nombreCurso" className="mb-1 block text-xs sm:text-sm font-bold text-heading">
                  Nombre del Curso *
                </Label>
                <Input
                  id="nombreCurso"
                  placeholder="Ej: Masterclass de Decoración con Globos"
                  value={nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  className={cn(
                    "h-9 sm:h-10 text-sm font-medium",
                    errores.nombre && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-invalid={Boolean(errores.nombre)}
                />
                <ErrorCampo mensaje={errores.nombre} />
              </div>

              {/* Slug con regenerador */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="slugCurso" className="text-xs sm:text-sm font-bold text-heading">
                    Slug (Identificador URL) *
                  </Label>
                  <button
                    type="button"
                    onClick={handleRegenerarSlug}
                    className="inline-flex items-center gap-1 text-xs font-bold text-icon-accent hover:underline cursor-pointer"
                    title="Regenerar slug desde el nombre del curso"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Sincronizar</span>
                  </button>
                </div>
                <Input
                  id="slugCurso"
                  placeholder="ej: masterclass-decoracion-globos"
                  value={slug}
                  onChange={(e) => {
                    setSlugEditadoManualmente(true);
                    const nuevoSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                    setSlug(nuevoSlug);
                    if (errores.slug) {
                      setErrores((prev) => {
                        const copy = { ...prev };
                        delete copy.slug;
                        return copy;
                      });
                    }
                  }}
                  className={cn(
                    "h-9 sm:h-10 font-mono text-sm",
                    errores.slug && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-invalid={Boolean(errores.slug)}
                />
                <ErrorCampo mensaje={errores.slug} />
                <p className="mt-1 text-xs text-muted-foreground">
                  Ruta web: <code className="text-foreground font-semibold font-mono">/cursos/{slug || "slug-del-curso"}</code>
                </p>
              </div>

              {/* Precios PEN y USD en 2 columnas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="precioPen" className="mb-1 block text-xs sm:text-sm font-bold text-heading">
                    Precio Regular (PEN) *
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      S/
                    </span>
                    <Input
                      id="precioPen"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="150.00"
                      value={precioPen}
                      onChange={(e) => {
                        setPrecioPen(e.target.value);
                        if (errores.precioPen) {
                          setErrores((prev) => {
                            const copy = { ...prev };
                            delete copy.precioPen;
                            return copy;
                          });
                        }
                      }}
                      className={cn(
                        "h-9 sm:h-10 pl-8 font-bold text-sm sm:text-base tabular-nums",
                        errores.precioPen && "border-destructive focus-visible:ring-destructive/30"
                      )}
                      aria-invalid={Boolean(errores.precioPen)}
                    />
                  </div>
                  <ErrorCampo mensaje={errores.precioPen} />
                </div>

                <div>
                  <Label htmlFor="precioUsd" className="mb-1 block text-xs sm:text-sm font-bold text-heading">
                    Precio Regular (USD)
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="precioUsd"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="40.00"
                      value={precioUsd}
                      onChange={(e) => {
                        setPrecioUsd(e.target.value);
                        if (errores.precioUsd) {
                          setErrores((prev) => {
                            const copy = { ...prev };
                            delete copy.precioUsd;
                            return copy;
                          });
                        }
                      }}
                      className={cn(
                        "h-9 sm:h-10 pl-7 font-medium text-sm sm:text-base tabular-nums",
                        errores.precioUsd && "border-destructive focus-visible:ring-destructive/30"
                      )}
                      aria-invalid={Boolean(errores.precioUsd)}
                    />
                  </div>
                  <ErrorCampo mensaje={errores.precioUsd} />
                </div>
              </div>

              {/* Estado de Publicación */}
              <div>
                <Label htmlFor="estadoCurso" className="mb-1 block text-xs sm:text-sm font-bold text-heading">
                  Estado de Publicación
                </Label>
                <Select
                  value={activo}
                  items={[
                    { value: "true", label: "Publicado (Visible en catálogo)" },
                    { value: "false", label: "Inhabilitado (Oculto en catálogo)" },
                  ]}
                  onValueChange={(val) => setActivo(val as "true" | "false")}
                >
                  <SelectTrigger id="estadoCurso" className="h-9 sm:h-10 w-full text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="text-sm">Publicado (Visible en catálogo)</SelectItem>
                    <SelectItem value="false" className="text-sm">Inhabilitado (Oculto en catálogo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Descripción Corta */}
              <div>
                <Label htmlFor="descripcionCurso" className="mb-1 block text-xs sm:text-sm font-bold text-heading">
                  Descripción Corta
                </Label>
                <Textarea
                  id="descripcionCurso"
                  rows={2}
                  placeholder="Breve resumen de lo que el alumno aprenderá en este curso..."
                  value={descripcion}
                  onChange={(e) => {
                    setDescripcion(e.target.value);
                    if (errores.descripcion) {
                      setErrores((prev) => {
                        const copy = { ...prev };
                        delete copy.descripcion;
                        return copy;
                      });
                    }
                  }}
                  className={cn(
                    "text-xs sm:text-sm resize-none min-h-[64px] sm:min-h-[72px]",
                    errores.descripcion && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-invalid={Boolean(errores.descripcion)}
                />
                <ErrorCampo mensaje={errores.descripcion} />
              </div>
            </div>

            {/* Columna 2 (4 cols): Portada con Previsualización y Auto-WebP */}
            <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-3.5">
              <div>
                <Label className="mb-1 block text-xs sm:text-sm font-bold text-heading">
                  Portada del Curso (16:9)
                </Label>

                {/* Caja de Vista Previa */}
                <div className="relative aspect-video max-h-[170px] 2xl:max-h-[200px] w-full rounded-2xl border-2 border-dashed border-border overflow-hidden bg-muted/30 flex flex-col items-center justify-center text-center p-2 sm:p-3 mx-auto">
                  {imagenUrl ? (
                    <>
                      <img
                        src={imagenUrl}
                        alt="Vista previa portada"
                        className="h-full w-full object-cover"
                        onLoad={() => setCargandoPreviewUrl(false)}
                        onError={() => setCargandoPreviewUrl(false)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagenUrl("");
                          setCargandoPreviewUrl(false);
                        }}
                        className="absolute top-2 right-2 size-7 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer z-30"
                        title="Quitar portada"
                      >
                        <X className="size-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground p-3">
                      <div className="size-9 rounded-full bg-muted flex items-center justify-center text-icon-accent">
                        <ImageIcon className="size-4 sm:size-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-heading">Sin portada seleccionada</span>
                      <span className="text-[11px] sm:text-xs">Sube una foto desde tu PC o pega una URL</span>
                    </div>
                  )}

                  {/* Overlay de Desenfoque y Progreso en Carga */}
                  <CargaMultimediaOverlay
                    cargando={subiendoImagen || cargandoPreviewUrl}
                    progreso={subiendoImagen ? progresoSubida : undefined}
                    mensaje={
                      subiendoImagen
                        ? mensajeSubida
                        : "Cargando vista previa de la portada..."
                    }
                    tipo="imagen"
                  />
                </div>
              </div>

              {/* Botón de Subida desde PC con Conversión WebP en Vivo */}
              <div className="space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  id="archivoPortadaCurso"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleSubirImagen}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  disabled={subiendoImagen}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-10 rounded-xl border-border bg-card text-xs sm:text-sm font-bold gap-2 cursor-pointer hover:bg-muted"
                >
                  {subiendoImagen ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-icon-accent" />
                      <span>Optimizando a WebP y subiendo...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-4 text-icon-accent" />
                      <span>Subir desde mi PC (Auto WebP)</span>
                    </>
                  )}
                </Button>

                <p className="text-[11px] sm:text-xs text-muted-foreground text-center leading-tight">
                  Cualquier PNG o JPG se optimiza automáticamente a <span className="font-bold text-foreground">WebP (~100 KB)</span> antes de subirlo a Supabase.
                </p>
              </div>

              {/* O URL Externa */}
              <div className="space-y-1 pt-1.5 border-t border-border">
                <Label htmlFor="imagenUrl" className="text-xs font-medium text-muted-foreground">
                  O pega la URL directa de la imagen:
                </Label>
                <Input
                  id="imagenUrl"
                  placeholder="https://ejemplo.com/portada.webp"
                  value={imagenUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setImagenUrl(val);
                    if (val.trim().startsWith("http")) {
                      setCargandoPreviewUrl(true);
                    } else {
                      setCargandoPreviewUrl(false);
                    }
                  }}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Columna 3 (4 cols): Simulador de Ganancia Neta y Cupones */}
            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l lg:pl-5 border-border pt-4 lg:pt-0">
              <SimuladorGananciaPrecios
                precioPen={precioPen}
                precioUsd={precioUsd}
                cupones={cupones}
              />
            </div>
          </div>

          {/* Pie Fijo con Acciones: Siempre visible en Mobile y Desktop */}
          <div className="shrink-0 border-t bg-card/95 backdrop-blur-xs px-5 sm:px-6 py-3 sm:py-3.5 flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-end z-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbierto(false)}
              className="rounded-full px-5 text-sm font-bold w-full sm:w-auto cursor-pointer h-9 sm:h-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={guardando || subiendoImagen}
              className="rounded-full px-5 text-sm font-bold w-full sm:w-auto cursor-pointer h-9 sm:h-10"
            >
              <Sparkles className="mr-1.5 size-4" />
              <span>{guardando ? "Creando curso..." : "Crear y Gestionar Clases"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
