import { Skeleton } from "@/components/ui/skeleton";

export default function AdminTalleresLoading() {
  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-6 sm:p-8 animate-in fade-in-50 duration-200">
      {/* 1. Banner Principal con Escáner y Botón Crear */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a]/90 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-xl bg-white/20 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-6 w-56 bg-white/30 rounded-md sm:h-7" />
              <Skeleton className="h-3.5 w-full max-w-md bg-white/20 rounded-md" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Skeleton className="h-10 w-44 rounded-full bg-white/30" />
            <Skeleton className="h-10 w-40 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col gap-4 lg:flex-row lg:items-center">
        <Skeleton className="h-10 w-full lg:max-w-md rounded-xl" />
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>

      {/* 3. Contenedor de la Tabla de Talleres */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        {/* Cabecera de la sección */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b bg-muted/20">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>

        {/* Filas de la Tabla */}
        <div className="divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 sm:p-5 gap-4">
              {/* Taller y Ubicación */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-52 rounded-md" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="size-3.5 rounded-full" />
                  <Skeleton className="h-3 w-40 rounded-md" />
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="hidden lg:flex items-center gap-2">
                <Skeleton className="size-3.5 rounded-full" />
                <Skeleton className="h-3.5 w-44 rounded-md" />
              </div>

              {/* Precios */}
              <div className="hidden xl:flex flex-col gap-1 text-right">
                <Skeleton className="h-4 w-20 rounded-md ml-auto" />
                <Skeleton className="h-3 w-16 rounded-md ml-auto" />
              </div>

              {/* Aforo / Cupos */}
              <div className="hidden sm:flex flex-col gap-1 text-center">
                <Skeleton className="h-4 w-16 rounded-md mx-auto" />
                <Skeleton className="h-3 w-20 rounded-md mx-auto" />
              </div>

              {/* Badges de Estado y En Puerta */}
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full hidden sm:block" />
              </div>

              {/* Botón Ver Asistentes + acciones */}
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-9 w-32 rounded-xl" />
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
