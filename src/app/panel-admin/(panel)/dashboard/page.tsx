// Admin: Dashboard principal armonizado con la identidad visual del Aula Virtual.
// Monitoreo en tiempo real de analíticas, finanzas, órdenes, cursos y operaciones de Amorelo.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  BookOpen,
  CalendarDays,
  DollarSign,
  GraduationCap,
  Receipt,
  ShoppingBag,
  TicketPercent,
  UserPlus,
  Users,
} from "lucide-react";
import {
  obtenerMetricasDashboard,
  type DashboardPeriodo,
} from "@/server/dashboard/consultas";
import { obtenerMensajeBannerAction } from "@/server/configuracion/acciones";
import { AdminMensajeBannerHero } from "@/components/admin/dashboard/admin-mensaje-banner-hero";
import { DashboardPeriodSelector } from "./components/dashboard-period-selector";

import { RevenueAreaChart } from "./components/revenue-area-chart";
import { VirtualVsPresencialChart } from "./components/virtual-vs-presencial-chart";
import { OrderStatusTable } from "./components/order-status-table";

interface AdminDashboardPageProps {
  searchParams: Promise<{
    periodo?: string;
    desde?: string;
    hasta?: string;
  }>;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const resolvedParams = await searchParams;
  const rawPeriodo = resolvedParams?.periodo;
  const periodoValido: DashboardPeriodo =
    rawPeriodo && ["hoy", "7d", "mes", "30d", "total", "personalizado"].includes(rawPeriodo)
      ? (rawPeriodo as DashboardPeriodo)
      : "30d";

  const desde = resolvedParams?.desde;
  const hasta = resolvedParams?.hasta;

  // Consultas agregadas 100% dinámicas de Supabase
  const [{ kpis, charts }, mensajeBanner] = await Promise.all([
    obtenerMetricasDashboard(periodoValido, desde, hasta),
    obtenerMensajeBannerAction(),
  ]);

  return (
    <main className="flex w-full flex-1 flex-col min-w-0 max-w-full overflow-x-hidden gap-6 p-4 sm:gap-8 sm:p-6 lg:p-8">
      {/* Tarjeta Hero Institucional — Azul Marino (#1e3a8a) idéntico al Aula */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a] p-5 text-white shadow-lg sm:rounded-3xl sm:p-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
              ✨ Panel de Administración General
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl text-white">
              ¡Hola, Administrador!
            </h1>
            <p className="mt-2 max-w-xl text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Supervisa las ventas de la Masterclass, el aula virtual, las matrículas activas de los alumnos y el rendimiento de TikTok Live.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link href="/panel-admin/clientes">
                <Button className="rounded-full bg-white font-bold text-[#1e3a8a] shadow-md hover:bg-slate-100 shrink-0">
                  <UserPlus className="mr-1.5 size-4" />
                  <span>Matricular Alumno (Manual)</span>
                </Button>
              </Link>

              <Link href="/panel-admin/cursos">
                <Button className="rounded-full bg-white font-bold text-[#1e3a8a] shadow-md hover:bg-slate-100 shrink-0">
                  <BookOpen className="mr-1.5 size-4" />
                  <span>Gestionar Cursos</span>
                </Button>
              </Link>

              <Link href="/panel-admin/ordenes">
                <Button className="rounded-full bg-white font-bold text-[#1e3a8a] shadow-md hover:bg-slate-100 shrink-0">
                  <Receipt className="mr-1.5 size-4" />
                  <span>Ver Órdenes</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Lado derecho: Control y edición rápida del mensaje motivacional para las alumnas */}
          <AdminMensajeBannerHero mensajeInicial={mensajeBanner} />
        </div>

        {/* Efecto decorativo de fondo */}
        <div className="absolute -right-8 -top-8 size-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Sección 1: Cabecera con Selector de Periodo Unificado y 5 KPIs Clave */}
      <section className="flex flex-col gap-4 w-full min-w-0 max-w-full">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/60 pb-3 dark:border-slate-800 w-full min-w-0">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
              Métricas Clave del Negocio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Datos unificados en tiempo real para:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {kpis.periodoEtiqueta}
              </strong>
            </p>
          </div>

          {/* Selector de Rango Temporal Unificado (con DatePicker reutilizado) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto min-w-0">
            <DashboardPeriodSelector
              periodoActual={periodoValido}
              desdeActual={desde}
              hastaActual={hasta}
            />

            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado
            </span>
          </div>
        </div>

        {/* Grilla de 5 KPIs Clave */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {/* KPI 1: Facturación Total (Cursos + Talleres) */}
          <KpiCard
            titulo="Ingresos Recaudados"
            valor={`S/ ${kpis.ingresosTotalPen.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
            badge={kpis.ingresosTotalUsd > 0 ? `+$${kpis.ingresosTotalUsd} USD` : kpis.periodoBadge}
            icono={DollarSign}
            tono="blue"
            tendencia={
              kpis.crecimientoIngresosPct !== null
                ? {
                    valor: `${kpis.crecimientoIngresosPct >= 0 ? "+" : ""}${kpis.crecimientoIngresosPct}%`,
                    positivo: kpis.crecimientoIngresosPct >= 0,
                    texto: "vs periodo anterior",
                  }
                : undefined
            }
            subtitulo={`Cursos: S/ ${kpis.ingresosVirtual.toFixed(0)} (${kpis.pctVirtual}%) • Talleres: S/ ${kpis.ingresosPresencial.toFixed(0)} (${kpis.pctPresencial}%)`}
          />

          {/* KPI 2: Ventas Confirmadas */}
          <KpiCard
            titulo="Ventas Pagadas"
            valor={kpis.ordenesPagadas}
            badge={`${kpis.totalOrdenesCreadas} creadas`}
            icono={ShoppingBag}
            tono="emerald"
            tendencia={{
              valor: `${kpis.tasaConversion}%`,
              positivo: kpis.tasaConversion >= 50,
              texto: "conversión",
            }}
            subtitulo={
              kpis.montoPendiente > 0
                ? `S/ ${kpis.montoPendiente.toFixed(0)} en ${kpis.ordenesPendientes} órdenes pendientes`
                : "Sin órdenes pendientes"
            }
            href="/panel-admin/ordenes"
          />

          {/* KPI 3: Ticket Promedio (AOV) */}
          <KpiCard
            titulo="Ticket Promedio (AOV)"
            valor={`S/ ${kpis.ticketPromedio.toFixed(2)}`}
            badge="Por orden pagada"
            icono={TicketPercent}
            tono="amber"
            tendencia={{ valor: "AOV", positivo: true, texto: "por compra" }}
            subtitulo={`Virtual S/ ${kpis.ticketPromedioVirtual.toFixed(0)} • Taller S/ ${kpis.ticketPromedioPresencial.toFixed(0)}`}
          />

          {/* KPI 4: Aforo Talleres Presenciales */}
          <KpiCard
            titulo="Aforo en Talleres"
            valor={`${kpis.ocupacionTalleres.porcentaje}%`}
            badge={`${kpis.ocupacionTalleres.cuposOcupados}/${kpis.ocupacionTalleres.cuposTotales} cupos`}
            icono={CalendarDays}
            tono="indigo"
            tendencia={{
              valor: `${kpis.ocupacionTalleres.cuposTotales - kpis.ocupacionTalleres.cuposOcupados} libres`,
              positivo: true,
              texto: "disponibles",
            }}
            subtitulo={`${kpis.ocupacionTalleres.talleresActivosCount} talleres programados`}
            href="/panel-admin/talleres"
          />

          {/* KPI 5: Matrículas Activas */}
          <KpiCard
            titulo="Matrículas Activas"
            valor={kpis.matriculasActivas}
            badge={kpis.matriculasNuevasPeriodo > 0 ? `+${kpis.matriculasNuevasPeriodo} en periodo` : "Aula virtual"}
            icono={GraduationCap}
            tono="purple"
            tendencia={{ valor: "Vigentes", positivo: true, texto: "con acceso activo" }}
            subtitulo="Alumnas con acceso al aula"
            href="/panel-admin/clientes"
          />
        </div>
      </section>

      {/* Sección 2: Visualizaciones y Gráficos */}
      <section className="flex flex-col gap-6">
        {/* Fila 1: Ingresos en el tiempo (2/3) + Virtual vs Presencial (1/3) */}
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueAreaChart
              data={charts.revenueOverTime}
              periodoEtiqueta={kpis.periodoEtiqueta}
              data30Days={charts.revenue30Days}
            />
          </div>
          <div className="lg:col-span-1">
            <VirtualVsPresencialChart
              data={charts.virtualVsPresencial}
              periodoEtiqueta={kpis.periodoEtiqueta}
            />
          </div>
        </div>

        {/* Fila 2: Resumen de Estados de Órdenes en Formato Tabla */}
        <div>
          <OrderStatusTable data={charts.orderStatus} />
        </div>
      </section>

      {/* Sección 3: Módulos de Gestión Rápida */}
      <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-xs sm:p-7 dark:border-white/10 dark:bg-slate-900">
        <h2 className="text-base font-extrabold text-heading">
          Módulos de Gestión Rápida
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Accesos directos a las áreas más utilizadas del panel de administración.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/panel-admin/clientes"
            className="group flex flex-col justify-between rounded-2xl border border-black/8 bg-slate-50/60 p-5 transition-all hover:border-[#1A73E8] hover:bg-blue-50/50 dark:border-white/10 dark:bg-slate-800/60 dark:hover:border-blue-500 dark:hover:bg-slate-800"
          >
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#1A73E8] text-white shadow-xs transition-transform group-hover:scale-105">
                <Users className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-800 text-sm group-hover:text-[#1A73E8] dark:text-slate-100 dark:group-hover:text-blue-400">
                Alumnos y Matrículas
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Matricula alumnos de WhatsApp, gestiona vigencias y reenvía accesos.
              </p>
            </div>
            <span className="mt-4 text-xs font-extrabold text-[#1A73E8] dark:text-blue-400 group-hover:underline">
              Ir al módulo &rarr;
            </span>
          </Link>

          <Link
            href="/panel-admin/cursos"
            className="group flex flex-col justify-between rounded-2xl border border-black/8 bg-slate-50/60 p-5 transition-all hover:border-[#1A73E8] hover:bg-blue-50/50 dark:border-white/10 dark:bg-slate-800/60 dark:hover:border-blue-500 dark:hover:bg-slate-800"
          >
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#1e3a8a] text-white shadow-xs transition-transform group-hover:scale-105">
                <BookOpen className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-800 text-sm group-hover:text-[#1e3a8a] dark:text-slate-100 dark:group-hover:text-blue-400">
                Cursos Virtuales
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Administra módulos, lecciones, precios, ofertas y recursos descargables.
              </p>
            </div>
            <span className="mt-4 text-xs font-extrabold text-[#1e3a8a] dark:text-blue-400 group-hover:underline">
              Ir al módulo &rarr;
            </span>
          </Link>

          <Link
            href="/panel-admin/talleres"
            className="group flex flex-col justify-between rounded-2xl border border-black/8 bg-slate-50/60 p-5 transition-all hover:border-teal-500 hover:bg-teal-50/50 dark:border-white/10 dark:bg-slate-800/60 dark:hover:border-teal-500 dark:hover:bg-slate-800"
          >
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#14b8a6] text-white shadow-xs transition-transform group-hover:scale-105">
                <CalendarDays className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-800 text-sm group-hover:text-teal-600 dark:text-slate-100 dark:group-hover:text-teal-400">
                Talleres Presenciales
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Monitorea aforos, valida asistencia con QR en puerta y emite diplomas.
              </p>
            </div>
            <span className="mt-4 text-xs font-extrabold text-teal-600 dark:text-teal-400 group-hover:underline">
              Ir al módulo &rarr;
            </span>
          </Link>

          <Link
            href="/panel-admin/ordenes"
            className="group flex flex-col justify-between rounded-2xl border border-black/8 bg-slate-50/60 p-5 transition-all hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-white/10 dark:bg-slate-800/60 dark:hover:border-emerald-500 dark:hover:bg-slate-800"
          >
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs transition-transform group-hover:scale-105">
                <Receipt className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-800 text-sm group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                Órdenes y Ventas
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Historial completo de pagos, comprobantes SUNAT, cupones y pasarelas.
              </p>
            </div>
            <span className="mt-4 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 group-hover:underline">
              Ir al módulo &rarr;
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
