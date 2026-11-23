import { Skeleton } from "@/components/ui/skeleton";

export default function AdminGestionarTemarioLoading() {
  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-6 sm:p-8 animate-in fade-in-50 duration-200">
      {/* Botón Volver */}
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 rounded-md" />
        <Skeleton className="h-4 w-44 rounded-md" />
      </div>

      {/* Banner Principal del Curso */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a]/90 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-xl bg-white/20 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-7 w-64 bg-white/30 rounded-md sm:h-8" />
              <Skeleton className="h-3.5 w-80 bg-white/20 rounded-md font-mono" />
            </div>
          </div>
          <Skeleton className="h-6 w-32 rounded-full bg-white/20 shrink-0" />
        </div>
      </div>

      {/* Pestañas (Temario y Clases / Proyectos & Constancias) */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-36 rounded-xl" />
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>

      {/* Cabecera de la sección Estructura Académica */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="space-y-1">
          <Skeleton className="h-6 w-72 rounded-md" />
          <Skeleton className="h-3.5 w-96 rounded-md" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl shrink-0" />
      </div>

      {/* Bloque Módulo 1 */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
        {/* Cabecera del Módulo */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-60 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>

        {/* Lecciones del Módulo 1 */}
        <div className="space-y-2 pl-4 sm:pl-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl border bg-muted/20"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 w-44 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloque Módulo 2 */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3 w-36 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  );
}
