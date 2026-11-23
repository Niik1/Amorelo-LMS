"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText, Receipt, QrCode } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { EntradaConfiguracionComprobante } from "@/lib/validators/configuracion";

interface PrevisualizadorComprobanteProps {
  datos: EntradaConfiguracionComprobante;
}

export function PrevisualizadorComprobante({
  datos,
}: PrevisualizadorComprobanteProps) {
  const [formato, setFormato] = useState<"a4" | "ticket">("a4");

  const esExonerado = datos.tratamiento_igv === "exonerado";
  const montoTotal = 150.0;
  const subtotal = esExonerado
    ? montoTotal
    : Number((montoTotal / (1 + (datos.porcentaje_igv || 18) / 100)).toFixed(2));
  const igv = esExonerado ? 0.0 : Number((montoTotal - subtotal).toFixed(2));

  return (
    <div className="flex flex-col gap-3">
      {/* Selector de Formato A4 / Ticket */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Vista Previa en Vivo
        </span>
        <Tabs
          value={formato}
          onValueChange={(v) => setFormato(v as "a4" | "ticket")}
          className="w-auto"
        >
          <TabsList className="h-9 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <TabsTrigger
              value="a4"
              className="text-xs px-3 py-1 font-semibold rounded-lg gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-xs dark:data-[state=active]:bg-slate-900"
            >
              <FileText className="size-3.5" />
              <span>Boleta A4</span>
            </TabsTrigger>
            <TabsTrigger
              value="ticket"
              className="text-xs px-3 py-1 font-semibold rounded-lg gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-xs dark:data-[state=active]:bg-slate-900"
            >
              <Receipt className="size-3.5" />
              <span>Ticket (80mm)</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Contenedor del Preview */}
      <div className="rounded-3xl border border-black/10 bg-slate-100/80 p-4 sm:p-6 shadow-inner flex justify-center items-start min-h-[580px] dark:border-white/10 dark:bg-slate-950/60 overflow-hidden">
        {formato === "a4" ? (
          /* ========================================================
             PREVIEW 1: BOLETA FORMAL EN HOJA A4
             ======================================================== */
          <div className="w-full max-w-[460px] bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200/90 p-5 sm:p-6 text-[10px] leading-relaxed transition-all dark:bg-white dark:text-slate-900">
            {/* Header: Emisor (Izquierda) + Box RUC (Derecha) */}
            <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-200">
              <div className="flex-1 min-w-0">
                {datos.logo_url && (
                  <div className="relative h-12 w-44 mb-1.5">
                    <Image
                      src={datos.logo_url}
                      alt="Logo"
                      fill
                      className="object-contain object-left"
                      unoptimized
                    />
                  </div>
                )}
                <div className="text-xs font-extrabold text-[#1E3A8A] tracking-wider mb-0.5 uppercase">
                  {datos.razon_social || "AMORELO PERU"}
                </div>
                <div className="text-[8px] font-bold text-slate-600 uppercase">
                  {datos.nombre_comercial || "Academia de Globos y detalles para sorprender"}
                </div>
                <div className="text-[8px] text-slate-500 mt-1 space-y-0.5">
                  <p>{datos.direccion || "Trujillo, Perú"}</p>
                  <p>WhatsApp: {datos.telefono || "+51 969906609"}</p>
                  {datos.correo && <p>Correo: {datos.correo}</p>}
                  {datos.sitio_web && <p>Web: {datos.sitio_web}</p>}
                </div>
              </div>

              {/* RUC Box */}
              <div className="border-2 border-[#1E3A8A] rounded-lg p-2 text-center w-36 shrink-0 bg-blue-50/40">
                <p className="text-[9.5px] font-bold text-[#1E3A8A]">
                  RUC {datos.ruc || "10771535785"}
                </p>
                <p className="text-[10px] font-extrabold text-slate-900 my-0.5">
                  BOLETA DE VENTA
                </p>
                <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-[#1E3A8A] text-[7.5px] font-bold rounded">
                  CONTROL INTERNO
                </span>
                <p className="text-[9.5px] font-mono font-bold mt-1 text-[#1E3A8A]">
                  B001 - 000001
                </p>
              </div>
            </div>

            {/* Datos del Cliente y Emisión en cajas paralelas */}
            <div className="grid grid-cols-2 gap-2 my-2.5 text-[8px]">
              <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                <div className="font-bold text-[#1E3A8A] border-b border-slate-200/60 pb-1 mb-1.5 uppercase text-[7.5px]">
                  DATOS DEL CLIENTE
                </div>
                <div className="space-y-1 text-slate-600">
                  <p><span className="font-bold text-slate-700">DNI:</span> 77153579</p>
                  <p><span className="font-bold text-slate-700">SEÑOR(A):</span> Mbappe Ronaldo</p>
                  <p><span className="font-bold text-slate-700">DIRECCIÓN:</span> Trujillo, Perú</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
                <div className="font-bold text-[#1E3A8A] border-b border-slate-200/60 pb-1 mb-1.5 uppercase text-[7.5px]">
                  DETALLE DE EMISIÓN
                </div>
                <div className="space-y-1 text-slate-600">
                  <p><span className="font-bold text-slate-700">FECHA EMISIÓN:</span> 09/11/2026</p>
                  <p><span className="font-bold text-slate-700">FECHA DE VENC.:</span> 09/11/2026</p>
                  <p><span className="font-bold text-slate-700">N° DE ORDEN:</span> #ORD-000008</p>
                  <p><span className="font-bold text-slate-700">MONEDA:</span> SOLES</p>
                </div>
              </div>
            </div>

            {/* Tabla de Items */}
            <div className="mt-2 border border-slate-200 rounded-md overflow-hidden text-[8.5px]">
              <div className="grid grid-cols-6 bg-[#1E3A8A] text-white font-bold p-1 text-center">
                <span className="col-span-1">CANT.</span>
                <span className="col-span-3 text-left pl-2">DESCRIPCIÓN / CONCEPTO</span>
                <span className="col-span-1">P. UNITARIO</span>
                <span className="col-span-1">IMPORTE</span>
              </div>
              <div className="grid grid-cols-6 p-1.5 border-b border-slate-100 items-center text-center">
                <span className="col-span-1">1</span>
                <span className="col-span-3 text-left pl-2 font-medium">
                  Masterclass de Decoración y Globos
                </span>
                <span className="col-span-1">S/ 150.00</span>
                <span className="col-span-1 font-semibold">S/ 150.00</span>
              </div>
            </div>

            {/* Totales y Letras */}
            <div className="flex justify-between items-start mt-3 gap-2">
              <div className="border border-slate-200 rounded p-2 bg-slate-50 text-[7.5px] text-slate-600 flex-1">
                <span className="font-bold text-slate-700 block mb-0.5">IMPORTE EN LETRAS</span>
                <span className="font-medium text-slate-800">SON: CIENTO CINCUENTA CON 00/100 SOLES</span>
              </div>

              <div className="w-36 text-[8px] border border-slate-200 rounded overflow-hidden">
                <div className="flex justify-between px-2 py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">{esExonerado ? "OP. EXONERADA:" : "OP. GRAVADA:"}</span>
                  <span className="font-medium">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">
                    I.G.V. ({esExonerado ? "0%" : `${datos.porcentaje_igv || 18}%`}):
                  </span>
                  <span className="font-medium">
                    S/ {igv.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between px-2 py-1 bg-[#1E3A8A] text-white font-bold">
                  <span>TOTAL A PAGAR:</span>
                  <span>S/ {montoTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Mensaje de Agradecimiento */}
            {datos.mensaje_agradecimiento && (
              <div className="mt-3 p-1.5 bg-blue-50 border border-blue-200/60 rounded text-center text-[8px] font-bold text-[#1E3A8A]">
                {datos.mensaje_agradecimiento}
              </div>
            )}

            {/* Pie Legal con QR */}
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200 text-[7px] text-slate-400 gap-2">
              <p className="flex-1 text-left leading-tight">
                {datos.pie_comprobante ||
                  "Este documento es un comprobante de control administrativo interno emitido por Amorelo."}
              </p>
              <QrCode className="size-8 text-slate-700 shrink-0 stroke-[1.5]" />
            </div>
          </div>
        ) : (
          /* ========================================================
             PREVIEW 2: FORMATO TICKET TÉRMICO (80mm)
             ======================================================== */
          <div className="w-full max-w-[270px] bg-white text-slate-900 rounded-lg shadow-xl border border-slate-300 p-4 font-mono text-[9px] leading-tight transition-all">
            {/* Header Centrado */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              {datos.logo_url ? (
                <div className="relative h-12 w-36 mx-auto mb-1.5">
                  <Image
                    src={datos.logo_url}
                    alt="Logo"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : null}
              <p className="font-bold text-xs uppercase tracking-wider">
                {datos.razon_social || "AMORELO"}
              </p>
              <p className="text-[8px] text-slate-500">
                {datos.nombre_comercial || "Academia de Globos"}
              </p>
              <p className="text-[8px] mt-0.5 font-bold">
                RUC: {datos.ruc || "20000000001"}
              </p>
              <p className="text-[7.5px] text-slate-500">{datos.direccion || "Lima, Perú"}</p>
              <p className="text-[7.5px] text-slate-500">
                Wsp: {datos.telefono || "+51 924 353 798"}
              </p>
            </div>

            {/* Identificación de Comprobante */}
            <div className="text-center my-2 py-1 bg-slate-50 border-y border-dashed border-slate-300">
              <p className="font-bold text-[10px]">BOLETA DE VENTA</p>
              <p className="text-[7.5px] text-slate-500">[ CONTROL INTERNO ]</p>
              <p className="font-bold">B001 - 000128</p>
            </div>

            {/* Datos Cliente */}
            <div className="text-[8px] space-y-0.5 pb-2 border-b border-dashed border-slate-300">
              <p>
                <span className="font-bold">FECHA:</span> 09/11/2026 14:30
              </p>
              <p>
                <span className="font-bold">CLIENTE:</span> María Rodríguez
              </p>
              <p>
                <span className="font-bold">DOC:</span> DNI 72839102
              </p>
            </div>

            {/* Items */}
            <div className="my-2 text-[8px] space-y-1">
              <div className="flex justify-between font-bold border-b border-slate-200 pb-0.5">
                <span>CANT / DESCRIPCIÓN</span>
                <span>TOTAL</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="truncate pr-1">1 x Globos Burbuja Pro</span>
                <span className="shrink-0 font-bold">150.00</span>
              </div>
            </div>

            {/* Totales */}
            <div className="pt-2 border-t border-dashed border-slate-300 space-y-0.5 text-[8.5px]">
              <div className="flex justify-between">
                <span>OP. GRAVADA / SUB:</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>IGV ({esExonerado ? "0%" : `${datos.porcentaje_igv || 18}%`}):</span>
                <span>{esExonerado ? "0.00" : `S/ ${igv.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-[11px] font-extrabold pt-1 border-t border-slate-800">
                <span>TOTAL A PAGAR:</span>
                <span>S/ {montoTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* QR */}
            <div className="flex justify-center my-3">
              <QrCode className="size-14 text-slate-800" />
            </div>

            {/* Mensaje de Agradecimiento */}
            {datos.mensaje_agradecimiento && (
              <p className="text-[8px] font-bold text-center text-slate-800 uppercase leading-snug mb-2">
                {datos.mensaje_agradecimiento}
              </p>
            )}

            {/* Leyenda Legal */}
            <p className="text-[6.5px] text-center text-slate-400 leading-tight">
              {datos.pie_comprobante ||
                "Comprobante de control administrativo interno emitido por Amorelo."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
