import { Skeleton } from "@/components/ui/skeleton";

export default function AdminConfiguracionLoading() {
  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-4 sm:p-6 animate-in fade-in-50 duration-200">
      {/* Banner de Configuración */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a]/90 p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl bg-white/20 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-6 w-64 bg-white/30 rounded-md sm:h-7" />
            <Skeleton className="h-3.5 w-full max-w-md bg-white/20 rounded-md" />
          </div>
        </div>
      </div>

      {/* Formulario de Configuración simulado */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-6">
        <div className="flex gap-2 border-b pb-4">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
