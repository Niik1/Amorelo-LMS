import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAsistentesTallerLoading() {
  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-6 sm:p-8 animate-in fade-in-50 duration-200">
      {/* Botón Volver */}
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 rounded-md" />
        <Skeleton className="h-4 w-44 rounded-md" />
      </div>

      {/* Banner Principal del Taller */}
      <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-7 w-72 rounded-md sm:h-8" />
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Skeleton className="h-10 w-44 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* Fila de 4 Métricas Horizontales */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 border-t pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Skeleton className="size-5 rounded-md shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de Búsqueda y Píldoras de Filtro */}
      <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col gap-4 xl:flex-row xl:items-center">
        <Skeleton className="h-10 w-full xl:max-w-md rounded-xl" />
        <div className="flex flex-wrap gap-2 xl:ml-auto">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>

      {/* Contenedor de la Tabla de Asistentes */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        {/* Cabecera de la sección con botones de exportar */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b bg-muted/20">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-40 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>

        {/* Filas de Asistentes */}
        <div className="divide-y">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 sm:p-5 gap-4">
              {/* Ticket */}
              <Skeleton className="h-4 w-20 rounded-md font-mono shrink-0" />

              {/* Asistente y DNI */}
              <div className="space-y-1 flex-1 min-w-0">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>

              {/* Contacto */}
              <div className="space-y-1 hidden md:block">
                <Skeleton className="h-3.5 w-32 rounded-md" />
                <Skeleton className="h-3 w-36 rounded-md" />
              </div>

              {/* Estado de Pago */}
              <Skeleton className="h-6 w-36 rounded-full shrink-0" />

              {/* Asistencia en Puerta */}
              <Skeleton className="h-6 w-20 rounded-full shrink-0" />

              {/* Acciones */}
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
