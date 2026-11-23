import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <main className="flex w-full flex-1 flex-col min-w-0 max-w-full overflow-x-hidden gap-6 p-4 sm:gap-8 sm:p-6 lg:p-8 animate-in fade-in-50 duration-200">
      {/* 1. Tarjeta Hero Institucional simulada */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a]/90 p-5 text-white shadow-lg sm:rounded-3xl sm:p-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-xl flex flex-col gap-3">
            <Skeleton className="h-4 w-44 bg-white/20 rounded-md" />
            <Skeleton className="h-8 w-64 bg-white/30 rounded-lg sm:h-9" />
            <Skeleton className="h-4 w-full max-w-md bg-white/20 rounded-md" />

            <div className="mt-2 flex flex-wrap gap-3">
              <Skeleton className="h-10 w-48 bg-white/30 rounded-full" />
              <Skeleton className="h-10 w-36 bg-white/20 rounded-full" />
              <Skeleton className="h-10 w-32 bg-white/20 rounded-full" />
            </div>
          </div>

          {/* Banner Hero lateral simulado */}
          <div className="mt-4 lg:mt-0 w-full lg:max-w-xs">
            <div className="rounded-2xl bg-white/10 p-5 border border-white/15 flex flex-col gap-3">
              <Skeleton className="h-4 w-32 bg-white/20 rounded-md" />
              <Skeleton className="h-4 w-full bg-white/15 rounded-md" />
              <Skeleton className="h-4 w-4/5 bg-white/15 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sección de Métricas Clave y 5 KPIs */}
      <section className="flex flex-col gap-4 w-full min-w-0 max-w-full">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/60 pb-3 dark:border-slate-800 w-full min-w-0">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-48 rounded-md" />
            <Skeleton className="h-3.5 w-64 rounded-md" />
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-40 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </div>

        {/* Grilla de 5 KPIs */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-2xl border bg-card p-4 sm:p-5 shadow-xs min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="size-8 rounded-xl" />
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Skeleton className="h-7 w-28 rounded-md" />
                <Skeleton className="h-3 w-36 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Sección de Gráficos */}
      <section className="flex flex-col gap-6">
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {/* Gráfico principal de área (2 cols) */}
          <div className="lg:col-span-2 rounded-3xl border border-black/8 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-slate-900 flex flex-col gap-4 min-h-[380px]">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-3.5 w-60 rounded-md" />
              </div>
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
            <div className="flex-1 w-full flex items-end gap-3 pt-8 pb-2">
              {[40, 65, 30, 85, 50, 95, 70, 60, 80, 45, 90, 75].map((h, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <Skeleton
                    className="w-full rounded-t-md"
                    style={{ height: `${h}%` }}
                  />
                  <Skeleton className="h-3 w-6 rounded-xs" />
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico circular / pie (1 col) */}
          <div className="lg:col-span-1 rounded-3xl border border-black/8 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-slate-900 flex flex-col justify-between min-h-[380px]">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-3.5 w-52 rounded-md" />
            </div>
            <div className="my-auto flex justify-center py-6">
              <Skeleton className="size-44 rounded-full" />
            </div>
            <div className="flex justify-center gap-4 pt-4 border-t">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
          </div>
        </div>

        {/* Tabla de órdenes recientes simulada */}
        <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-slate-900 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-3.5 w-56 rounded-md" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl border border-muted/50 bg-muted/20"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-3.5 w-32 rounded-md" />
                    <Skeleton className="h-3 w-44 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
