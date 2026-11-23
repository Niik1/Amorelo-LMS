import { Skeleton } from "@/components/ui/skeleton";

export default function AulaDashboardLoading() {
  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-6 p-4 sm:p-6 max-w-full animate-in fade-in-50 duration-200">
      {/* 1. Tarjeta Hero de Bienvenida simulada */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a]/90 p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-xl flex flex-col gap-3">
            <Skeleton className="h-4 w-36 bg-white/20 rounded-md" />
            <Skeleton className="h-8 w-60 bg-white/30 rounded-lg sm:h-9" />
            <Skeleton className="h-4 w-80 bg-white/20 rounded-md" />
            <Skeleton className="h-10 w-52 bg-white/30 rounded-full mt-2" />
          </div>

          {/* Banner motivacional simulado */}
          <div className="mt-4 lg:mt-0 w-full lg:max-w-xs">
            <div className="rounded-xl bg-white/10 p-4 border border-white/15 flex flex-col gap-2">
              <Skeleton className="h-4 w-28 bg-white/20 rounded-md" />
              <Skeleton className="h-3.5 w-full bg-white/15 rounded-md" />
              <Skeleton className="h-3.5 w-3/4 bg-white/15 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPIs de resumen (4 tarjetas) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1.5 mt-3">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Sección Mis Cursos */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-36 rounded-md" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border bg-card shadow-sm flex flex-col"
            >
              {/* Imagen del curso (16:9) */}
              <div className="relative aspect-video w-full bg-muted/60">
                <Skeleton className="h-full w-full" />
              </div>

              {/* Contenido de la tarjeta */}
              <div className="p-4 flex flex-col gap-3">
                <Skeleton className="h-5 w-4/5 rounded-md" />

                {/* Barra de progreso */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-3 w-8 rounded-md" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>

                {/* Días restantes */}
                <div className="flex items-center gap-2 pt-1 border-t mt-1">
                  <Skeleton className="size-3.5 rounded-full" />
                  <Skeleton className="h-3 w-36 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
