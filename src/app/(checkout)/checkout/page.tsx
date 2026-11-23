import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { CURSO_SLUG } from "@/lib/config/curso";
import { CheckoutFormulario, type CheckoutCurso } from "@/components/checkout/checkout-formulario";

export const metadata: Metadata = {
  title: "Inscripción a la Masterclass | Amorelo",
  description: "Completa tu pago seguro para acceder inmediatamente a la Masterclass de Decoración y Globos.",
};

async function obtenerCursoActivo(slugOId?: string): Promise<CheckoutCurso | null> {
  const admin = createAdminClient();

  // 1. Si viene un slug o id específico en la URL (?curso=...)
  if (slugOId) {
    const { data: cursoEspecifico } = await admin
      .from("cursos")
      .select("id, nombre, slug, precio_pen, precio_usd, imagen_url")
      .eq("activo", true)
      .or(`slug.eq.${slugOId},id.eq.${slugOId}`)
      .maybeSingle();

    if (cursoEspecifico) {
      return {
        id: cursoEspecifico.id,
        nombre: cursoEspecifico.nombre,
        slug: cursoEspecifico.slug,
        precio_pen: Number(cursoEspecifico.precio_pen),
        precio_usd: Number(cursoEspecifico.precio_usd || 40),
        imagen_url: cursoEspecifico.imagen_url,
      };
    }
  }

  // 2. Si no se especificó o no se encontró, priorizar el curso principal de la landing (CURSO_SLUG)
  const { data: cursoPrincipal } = await admin
    .from("cursos")
    .select("id, nombre, slug, precio_pen, precio_usd, imagen_url")
    .eq("slug", CURSO_SLUG)
    .eq("activo", true)
    .maybeSingle();

  if (cursoPrincipal) {
    return {
      id: cursoPrincipal.id,
      nombre: cursoPrincipal.nombre,
      slug: cursoPrincipal.slug,
      precio_pen: Number(cursoPrincipal.precio_pen),
      precio_usd: Number(cursoPrincipal.precio_usd || 40),
      imagen_url: cursoPrincipal.imagen_url,
    };
  }

  // 3. Fallback en caso no exista el curso por slug: el curso activo más reciente
  const { data: cursoFallback } = await admin
    .from("cursos")
    .select("id, nombre, slug, precio_pen, precio_usd, imagen_url")
    .eq("activo", true)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cursoFallback) return null;

  return {
    id: cursoFallback.id,
    nombre: cursoFallback.nombre,
    slug: cursoFallback.slug,
    precio_pen: Number(cursoFallback.precio_pen),
    precio_usd: Number(cursoFallback.precio_usd || 40),
    imagen_url: cursoFallback.imagen_url,
  };
}

// Control manual: cambiar a true cuando el negocio cuente con RUC 20 para activar pasarela
const PASARELA_ACTIVA = false;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ curso?: string }>;
}) {
  if (!PASARELA_ACTIVA) {
    redirect("/");
  }

  const params = await searchParams;
  const curso = await obtenerCursoActivo(params?.curso);

  if (!curso) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl font-black text-[#1F3A6E] sm:text-3xl">
          Finaliza tu compra
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Estás a un paso de comenzar tu formación profesional en {curso.nombre}.
        </p>
      </div>

      <CheckoutFormulario curso={curso} />
    </div>
  );
}
