# Amorelo LMS & E-Learning Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Sentry](https://img.shields.io/badge/Sentry-Monitoring-362D59?style=for-the-badge&logo=sentry)](https://sentry.io/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Testing-2EAD33?style=for-the-badge&logo=playwright)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit%20Testing-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev/)

Plataforma full-stack moderna de **gestión y venta de cursos y masterclasses en línea (LMS)** desarrollada con Next.js (App Router), TypeScript y Supabase. Integra pasarelas de pago múltiples (Mercado Pago y PayPal), facturación electrónica SUNAT, aula virtual para estudiantes, panel de administración con analíticas avanzadas y un riguroso pipeline de calidad y pruebas automatizadas.

---

## 🚀 Módulos y Arquitectura del Sistema

El proyecto sigue una arquitectura modular desacoplada aprovechando los *Route Groups* de Next.js:

- **Portal Público (`(public)`):** Landing page corporativa orientada a conversión, catálogo de cursos/masterclasses, ficha técnica, preguntas frecuentes y diseño adaptable para dispositivos móviles.
- **Flujo de Checkout (`(checkout)`):** Experiencia de compra fluida con soporte para cupones dinámicos, cálculo de descuentos y validación estricta de orden en servidor.
- **Pasarela de Pago:**
  - **Mercado Pago:** Checkout Pro con webhooks para confirmación asíncrona de pagos en moneda local (PEN).
- **Aula Virtual (`(aula)`):** Plataforma para estudiantes inscritos con acceso seguro a clases, visualización de contenido, descarga de material y seguimiento de avance.
- **Panel Administrativo (`panel-admin`):** Dashboard centralizado para gestión de ventas, estudiantes, catálogo de productos, cupones, emisión de comprobantes y métricas interactivas con **Recharts** y exportación a **Excel (ExcelJS)**.
- **Facturación Electrónica:** Emisión y generación de comprobantes tributarios (Boleta / Factura SUNAT) con generación de documentos en PDF usando `@react-pdf/renderer`.
- **Seguridad y Resiliencia:** Protección contra bots con **Cloudflare Turnstile**, rate limiting distribuido mediante **Upstash Redis**, validación estricta de esquemas en runtime con **Zod** y Row Level Security (RLS) en base de datos.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Motion, GSAP |
| **Backend & Base de Datos** | Next.js Server Actions & Route Handlers, Supabase (PostgreSQL + Auth SSR + RLS) |
| **Pagos & Facturación** | SDK Mercado Pago, React-PDF |
| **Servicios Cloud** | Resend (Emails transaccionales), Upstash Redis (Rate limiting), Cloudflare Turnstile |
| **Monitoreo & Logs** | Sentry (Client, Edge y Server) |
| **Pruebas & Calidad** | Vitest, Testing Library, Playwright (E2E), ESLint, Prettier |

---

## ⚙️ Requisitos Previos

- **Node.js:** Versión `20.x` o superior recomendada.
- **Gestor de paquetes:** `npm` (o `pnpm` / `yarn`).
- Cuenta en **Supabase** y credenciales de APIs de pago/servicios (Mercado Pago, Resend).

---

## 📁 Estructura del Proyecto

```plaintext
├── src/
│   ├── app/                 # Rutas y páginas de Next.js (App Router)
│   │   ├── (aula)/          # Zona privada del estudiante (LMS)
│   │   ├── (auth)/          # Autenticación (Login, Registro, Recuperación)
│   │   ├── (checkout)/      # Proceso de pago y confirmación de compra
│   │   ├── (public)/        # Landing page, catálogo y vistas corporativas
│   │   ├── api/             # Webhooks (Mercado Pago, PayPal) y endpoints REST
│   │   └── panel-admin/     # Dashboard y gestión administrativa
│   ├── components/          # Componentes UI reutilizables (shadcn/ui + custom)
│   ├── hooks/               # Custom hooks de React
│   ├── lib/                 # Utilidades, clientes de APIs (Supabase, Upstash, etc.)
│   ├── server/              # Server Actions, lógica de negocio y servicios
│   └── types/               # Definiciones globales de TypeScript
├── tests/                   # Suites de pruebas unitarias y e2e
├── public/                  # Recursos estáticos (imágenes, fuentes, favicons)
└── .env.example             # Plantilla de variables de entorno requeridas
```

---

## 📄 Licencia

Este proyecto fue desarrollado con fines comerciales y de portafolio personal. Todos los derechos reservados.
