"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PAISES, type PaisItem, obtenerIsoDePais } from "@/lib/paises/paises";

export { PAISES, type PaisItem };

export function SelectorPaisTelefono({
  paisSeleccionado,
  onCambiarPais,
  valorTelefono,
  onCambiarTelefono,
}: {
  paisSeleccionado: string;
  onCambiarPais: (codigoIso: string) => void;
  valorTelefono: string;
  onCambiarTelefono: (valor: string) => void;
}) {
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  const isoActual = obtenerIsoDePais(paisSeleccionado);
  const paisActual =
    PAISES.find((p) => p.codigoIso === isoActual) ?? PAISES[0];

  const handleSeleccionar = (p: PaisItem) => {
    onCambiarPais(p.codigoIso);
    setDropdownAbierto(false);
  };

  return (
    <div className="relative flex rounded-xl border border-black/15 bg-white transition-all focus-within:border-[#1A73E8] focus-within:ring-2 focus-within:ring-[#1A73E8]/20">
      {/* Botón selector de bandera y prefijo */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownAbierto((prev) => !prev)}
          className="flex h-11 items-center gap-1.5 border-r border-black/10 bg-slate-50 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
          aria-haspopup="listbox"
          aria-expanded={dropdownAbierto}
        >
          <span className="text-lg leading-none" role="img" aria-label={paisActual.nombre}>
            {paisActual.bandera}
          </span>
          <span className="text-xs font-bold text-slate-700">{paisActual.prefijo}</span>
          <ChevronDown className="size-3.5 text-slate-400" />
        </button>

        {dropdownAbierto && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setDropdownAbierto(false)}
            />
            <div className="absolute top-full left-0 z-40 mt-1 max-h-60 w-64 overflow-y-auto rounded-xl border border-black/10 bg-white py-1.5 shadow-xl">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Selecciona tu país
              </div>
              {PAISES.map((p) => (
                <button
                  key={p.codigoIso}
                  type="button"
                  onClick={() => handleSeleccionar(p)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                    p.codigoIso === paisActual.codigoIso
                      ? "bg-blue-50 font-bold text-[#1A73E8]"
                      : "text-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className="text-base" role="img" aria-label={p.nombre}>
                      {p.bandera}
                    </span>
                    <span className="truncate">{p.nombre}</span>
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{p.prefijo}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Input de número telefónico */}
      <input
        type="tel"
        inputMode="tel"
        required
        placeholder={paisActual.formatoEjemplo}
        value={valorTelefono}
        onChange={(e) => onCambiarTelefono(e.target.value)}
        className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
