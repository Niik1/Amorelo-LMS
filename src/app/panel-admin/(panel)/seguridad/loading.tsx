import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSeguridadLoading() {
  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 animate-in fade-in-50 duration-200">
      {/* Banner de Seguridad */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a]/90 p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl bg-white/20 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-6 w-36 bg-white/30 rounded-md sm:h-7" />
            <Skeleton className="h-3.5 w-full bg-white/20 rounded-md" />
          </div>
        </div>
      </div>

      {/* Grid de 2 columnas skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        <div className="lg:col-span-5 xl:col-span-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
