import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ModuloBannerProps {
  titulo: string;
  descripcion?: string;
  icono?: LucideIcon;
  acciones?: ReactNode;
  className?: string;
}

export function ModuloBanner({
  titulo,
  descripcion,
  icono: Icono,
  acciones,
  className,
}: ModuloBannerProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-[#1e3a8a] p-6 text-white shadow-lg sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          {Icono && <Icono className="size-7 sm:size-8 shrink-0 text-white/85" />}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {titulo}
            </h1>
            {descripcion && (
              <p className="mt-1 text-xs text-white/80 sm:text-sm">
                {descripcion}
              </p>
            )}
          </div>
        </div>

        {acciones && (
          <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
            {acciones}
          </div>
        )}
      </div>
    </div>
  );
}
