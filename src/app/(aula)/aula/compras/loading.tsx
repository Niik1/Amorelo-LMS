import { Skeleton } from "@/components/ui/skeleton";

export default function MisComprasLoading() {
  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-6 p-4 sm:p-6 max-w-full animate-in fade-in-50 duration-200">
      {/* 1. Banner Principal simulado */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a]/90 p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl bg-white/20 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-6 w-64 bg-white/30 rounded-md sm:h-7" />
            <Skeleton className="h-3.5 w-full max-w-md bg-white/20 rounded-md" />
          </div>
        </div>
      </div>

      {/* 2. Tarjetas de Métricas Resumen (3 tarjetas) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex items-center justify-between"
          >
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
            <Skeleton className="size-11 rounded-full" />
          </div>
        ))}
      </div>

      {/* 3. Lista de Órdenes y Compras */}
      <div className="flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-4"
          >
            {/* Header de la orden */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>
            </div>

            {/* Items y detalles */}
            <div className="space-y-2 py-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-60 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-44 rounded-md" />
                <Skeleton className="h-3.5 w-16 rounded-md" />
              </div>
            </div>

            {/* Botón de comprobante */}
            <div className="flex items-center justify-end border-t pt-3">
              <Skeleton className="h-9 w-48 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
