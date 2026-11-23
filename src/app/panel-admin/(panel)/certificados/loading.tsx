import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCertificadosLoading() {
  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-6 sm:p-8 animate-in fade-in-50 duration-200">
      {/* Banner de Certificados */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a]/90 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-xl bg-white/20 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-6 w-60 bg-white/30 rounded-md sm:h-7" />
              <Skeleton className="h-3.5 w-full max-w-md bg-white/20 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-10 w-44 rounded-full bg-white/30 shrink-0" />
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs flex flex-col gap-4 lg:flex-row lg:items-center">
        <Skeleton className="h-10 w-full lg:max-w-xs rounded-xl" />
        <Skeleton className="h-10 w-full lg:w-48 rounded-xl" />
      </div>

      {/* Tabla de Certificados */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div className="border-b bg-muted/40 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 gap-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-44 rounded-md" />
                <Skeleton className="h-3 w-56 rounded-md font-mono" />
              </div>
              <Skeleton className="h-4 w-32 rounded-md hidden md:block" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="size-8 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
