import { Skeleton } from "@/components/ui/skeleton";

export default function MisTalleresLoading() {
  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-6 p-4 sm:p-6 max-w-full animate-in fade-in-50 duration-200">
      {/* 1. Banner del Módulo simulado */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a]/90 p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl bg-white/20 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-6 w-56 bg-white/30 rounded-md sm:h-7" />
            <Skeleton className="h-3.5 w-full max-w-md bg-white/20 rounded-md" />
          </div>
        </div>
      </div>

      {/* 2. Lista de Talleres Presenciales (2 columnas) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border bg-card shadow-sm flex flex-col justify-between"
          >
            <div className="p-5 sm:p-6 space-y-4">
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32 rounded-full" />
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>

              {/* Caja de fecha, hora y sede */}
              <div className="rounded-xl bg-muted/40 p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-4 rounded-md" />
                  <Skeleton className="h-4 w-48 rounded-md" />
                </div>
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-4 rounded-md" />
                  <Skeleton className="h-4 w-36 rounded-md" />
                </div>
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-4 rounded-md" />
                  <Skeleton className="h-4 w-60 rounded-md" />
                </div>
              </div>

              {/* Caja de ticket y estado de abono */}
              <div className="rounded-xl border p-4 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>

            {/* Botón inferior */}
            <div className="p-5 sm:p-6 pt-0">
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
