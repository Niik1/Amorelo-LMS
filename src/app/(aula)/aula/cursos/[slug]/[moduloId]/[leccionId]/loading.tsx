import { Skeleton } from "@/components/ui/skeleton";

export default function LeccionLoading() {
  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-4 p-4 sm:p-6 max-w-full animate-in fade-in-50 duration-200">
      {/* 1. Navegación superior (Volver al temario + Nombre del curso) */}
      <div className="flex flex-col gap-7 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <Skeleton className="h-4 w-4 rounded-md" />
          <Skeleton className="h-4 w-44 rounded-md" />
        </div>
      </div>

      {/* 2. Distribución en 2 Columnas Desktop (70% Izquierda / 30% Derecha) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* COLUMNA IZQUIERDA (~70% en Desktop: 8 cols) */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          {/* Encabezado informativo de la lección */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-3.5 w-48 rounded-md" />
              <Skeleton className="h-7 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
          </div>

          {/* Reproductor de video (Aspect Ratio 16:9) */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-muted/60 shadow-sm flex items-center justify-center">
            <Skeleton className="h-full w-full" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="size-14 rounded-full bg-background/50 border border-muted-foreground/20 flex items-center justify-center shadow-inner">
                <div className="size-0 border-y-8 border-y-transparent border-l-12 border-l-muted-foreground/40 ml-1" />
              </div>
            </div>
          </div>

          {/* Barra de acciones y navegación entre clases */}
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-11 w-44 rounded-xl" />
              <Skeleton className="h-11 w-48 rounded-xl" />
            </div>
            <div className="flex items-center justify-between border-t pt-3 mt-1">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (~30% en Desktop: 4 cols) */}
        <div className="lg:col-span-4">
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5 shadow-sm">
            {/* Header del temario + progreso */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>

            {/* Módulos y lecciones simuladas */}
            <div className="flex flex-col gap-3 mt-2">
              {/* Módulo 1 simulado */}
              <div className="flex flex-col gap-2 rounded-xl border p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-44 rounded-md" />
                  <Skeleton className="h-4 w-4 rounded-md" />
                </div>
                <div className="flex flex-col gap-1.5 pt-2 pl-2 border-t border-muted/50">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-3.5 rounded-full" />
                    <Skeleton className="h-3 w-52 rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-3.5 rounded-full" />
                    <Skeleton className="h-3 w-40 rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-3.5 rounded-full" />
                    <Skeleton className="h-3 w-48 rounded-md" />
                  </div>
                </div>
              </div>

              {/* Módulo 2 simulado */}
              <div className="flex flex-col gap-2 rounded-xl border p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-4 w-4 rounded-md" />
                </div>
                <div className="flex flex-col gap-1.5 pt-2 pl-2 border-t border-muted/50">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-3.5 rounded-full" />
                    <Skeleton className="h-3 w-44 rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-3.5 rounded-full" />
                    <Skeleton className="h-3 w-36 rounded-md" />
                  </div>
                </div>
              </div>

              {/* Módulo 3 simulado */}
              <div className="flex flex-col gap-2 rounded-xl border p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40 rounded-md" />
                  <Skeleton className="h-4 w-4 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
