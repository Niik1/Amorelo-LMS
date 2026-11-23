import { Skeleton } from "@/components/ui/skeleton";

export default function CursoTemarioLoading() {
  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-6 p-4 sm:p-6 max-w-full animate-in fade-in-50 duration-200">
      {/* Botón Volver */}
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 rounded-md" />
        <Skeleton className="h-4 w-28 rounded-md" />
      </div>

      {/* Hero del Curso */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a]/90 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-32 bg-white/20 rounded-full" />
            <Skeleton className="h-8 w-3/4 bg-white/30 rounded-lg sm:h-9" />
            <Skeleton className="h-4 w-full max-w-lg bg-white/20 rounded-md" />

            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <Skeleton className="h-10 w-48 bg-white/30 rounded-full" />
              <Skeleton className="h-4 w-36 bg-white/20 rounded-md" />
            </div>
          </div>

          <div className="w-full lg:w-72 aspect-video rounded-xl bg-white/10 shrink-0">
            <Skeleton className="h-full w-full rounded-xl bg-white/15" />
          </div>
        </div>
      </div>

      {/* Lista de Módulos del Temario */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-44 rounded-md" />

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-52 rounded-md" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
                <Skeleton className="size-5 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
