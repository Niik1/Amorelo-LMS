import { Skeleton } from "@/components/ui/skeleton";

export default function MisConstanciasLoading() {
  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-8 p-4 sm:p-6 max-w-full animate-in fade-in-50 duration-200">
      {/* 1. Banner Principal simulado */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a]/90 p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl bg-white/20 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-6 w-60 bg-white/30 rounded-md sm:h-7" />
            <Skeleton className="h-3.5 w-full max-w-md bg-white/20 rounded-md" />
          </div>
        </div>
      </div>

      {/* 2. Indicador de Avance de Proyectos simulado */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>

      {/* 3. Sección de Constancias Emitidas */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className="h-5 w-48 rounded-md" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border bg-card p-5 sm:p-6 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-44 rounded-full" />
                  <Skeleton className="h-6 w-4/5 rounded-md" />
                  <Skeleton className="h-3.5 w-36 rounded-md" />
                </div>
                <Skeleton className="size-8 rounded-full" />
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <Skeleton className="h-3.5 w-32 rounded-md" />
                <Skeleton className="h-3.5 w-24 rounded-md" />
              </div>

              <div className="mt-5 flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
