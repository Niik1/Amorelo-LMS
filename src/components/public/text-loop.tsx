// TextLoop oficial de React Bits (textPath SVG + GSAP), adaptado a Amorelo:
// defaults con nuestras 5 frases, cinta wave en azul btn, texto blanco en
// Nunito bold mayusculas. Adaptaciones: el SVG recorta con slice a alto
// fijo (la banda no ocupa 600px) y la familia tipografica entra por el prop
// `style` (herencia CSS hasta el <text>).
//
// SIN re-render de contenido tras hidratar: el tiling se pinta fijo desde
// el SSR con REPS copias (sobran las que el textPath recorta al fin del
// path) y las medidas al vuelo van en refs (si no, el swap 1->N copias
// despues de hidratar re-triggerea el LCP con un "render delay" de ~2.2s
// en navegadores lentos). El span de la animacion se recalcula en refs
// (y con tick al cargar la fuente) sin tocar el DOM del texto.

'use client';

import { CSSProperties, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

export type TextLoopShape = 'wave' | 'circle' | 'infinity' | 'arch' | 'line';
export type TextLoopDirection = 'forward' | 'reverse';

export interface TextLoopProps {
  text?: string;
  shape?: TextLoopShape;
  path?: string;
  speed?: number;
  direction?: TextLoopDirection;
  separator?: string;
  curviness?: number;
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: number;
  uppercase?: boolean;
  color?: string;
  ribbon?: boolean;
  ribbonColor?: string;
  ribbonWidth?: number;
  pauseOnHover?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface Span {
  length: number;
  unitWidth: number;
}

const VIEW_W = 1200;
const VIEW_H = 520;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const EDGE_PAD = 6;
const SPARKLE = '\u2726';
const NBSP = '\u00A0';

// Copias fijas del tiling desde el SSR. Sobra: el textPath recorta al fin
// del path, y overflow-hidden oculta lo excedente. Cubre los 2 breakdowns
// (mobile 80px y desktop 30px) con cualquier métrica de fuente razonable,
// de modo que el DOM del texto jamás cambia despues de la carga (LCP).
const REPS = 8;

const buildPath = (shape: TextLoopShape, curviness: number, ribbonWidth: number): string => {
  const c = Math.max(0, curviness);
  const room = Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);

  switch (shape) {
    case 'circle': {
      const r = Math.min(90 + c * 0.95, room);
      return `M ${CX - r} ${CY} A ${r} ${r} 0 1 1 ${CX + r} ${CY} A ${r} ${r} 0 1 1 ${CX - r} ${CY} Z`;
    }
    case 'infinity': {
      const r = 150 + c * 1.4;
      const h = Math.min(60 + c * 0.95, room);
      return [
        `M ${CX} ${CY}`,
        `C ${CX + r * 0.55} ${CY - h} ${CX + r} ${CY - h} ${CX + r} ${CY}`,
        `C ${CX + r} ${CY + h} ${CX + r * 0.55} ${CY + h} ${CX} ${CY}`,
        `C ${CX - r * 0.55} ${CY - h} ${CX - r} ${CY - h} ${CX - r} ${CY}`,
        `C ${CX - r} ${CY + h} ${CX - r * 0.55} ${CY + h} ${CX} ${CY}`,
        'Z'
      ].join(' ');
    }
    case 'arch': {
      const rise = Math.min(120 + c * 1.1, room * 2);
      return `M 120 ${CY + rise / 2} Q ${CX} ${CY - rise * 1.5} ${VIEW_W - 120} ${CY + rise / 2}`;
    }
    case 'line':
      return `M -320 ${CY} L ${VIEW_W + 320} ${CY}`;
    case 'wave':
    default: {
      const a = Math.min(c * 2.2, room * 2);
      return `M -320 ${CY} Q -160 ${CY - a} 0 ${CY} T 320 ${CY} T 640 ${CY} T 960 ${CY} T 1280 ${CY} T ${VIEW_W + 320} ${CY}`;
    }
  }
};

const DEFAULT_TEXT = [
  'Básico',
  'Intermedio',
  'Avanzado',
  'Técnicas',
  'Costos',
].join(` ${SPARKLE} `);

const TextLoop = ({
  text = DEFAULT_TEXT,
  shape = 'wave',
  path,
  speed = 50,
  direction = 'forward',
  separator = SPARKLE,
  curviness = 12,
  fontSize = 20,
  fontWeight = 700,
  letterSpacing = 1,
  uppercase = true,
  color = '#ffffff',
  ribbon = true,
  ribbonColor = '#0077C8',
  ribbonWidth = 72,
  pauseOnHover = true,
  className = '',
  style = {}
}: TextLoopProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const measureRef = useRef<SVGTextElement | null>(null);
  const headRef = useRef<SVGTextPathElement | null>(null);
  const tailRef = useRef<SVGTextPathElement | null>(null);

  const [metrics, setMetrics] = useState<Span>({ length: 0, unitWidth: 0 });

  const rawId = useId();
  const pathId = `text-loop-${rawId.replace(/:/g, '')}`;

  const d = useMemo(() => path || buildPath(shape, curviness, ribbonWidth), [path, shape, curviness, ribbonWidth]);

  const unit = useMemo(() => {
    const base = uppercase ? String(text).toUpperCase() : String(text);
    const gap = separator ? `${NBSP}${NBSP}${separator}${NBSP}${NBSP}` : `${NBSP}${NBSP}${NBSP}`;
    return `${base}${gap}`;
  }, [text, separator, uppercase]);

  const textStyle = useMemo<CSSProperties>(
    () => ({ fontSize: `${fontSize}px`, fontWeight, letterSpacing: `${letterSpacing}px` }),
    [fontSize, fontWeight, letterSpacing]
  );

  useLayoutEffect(() => {
    const pathEl = pathRef.current;
    const measureEl = measureRef.current;
    if (!pathEl || !measureEl) return undefined;

    let cancelled = false;

    const measure = () => {
      let length = 0;
      let unitWidth = 0;
      try {
        length = pathEl.getTotalLength();
        unitWidth = measureEl.getComputedTextLength();
      } catch {
        return;
      }
      if (!length || !unitWidth) return;
      if (cancelled) return;

      setMetrics(prev =>
        prev.length === length && prev.unitWidth === unitWidth
          ? prev
          : { length, unitWidth },
      );
    };

    measure();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    // Re-mide al cambiar el viewport: la instancia oculta por breakpoint
    // (display:none) mide 0 y queda estatica; al rotar o cruzar el breakpoint
    // se recalcula sola sin remontar.
    let resizeId = 0;
    const onResize = () => {
      window.clearTimeout(resizeId);
      resizeId = window.setTimeout(measure, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      window.clearTimeout(resizeId);
      window.removeEventListener('resize', onResize);
    };
  }, [d, unit, fontSize, fontWeight, letterSpacing]);

  useEffect(() => {
    const { length, unitWidth } = metrics;
    const head = headRef.current;
    const tail = tailRef.current;
    if (!head || !tail || !length || !unitWidth) return undefined;

    // Span de animacion en copias ENTERAS del string: el loop anima de 0 a
    // span (reps necesarias x unidad), y el DOM tiene REPS >= repsPorTiling
    // copias pintadas de sobra (las extras quedan recortadas al fin del
    // path). Nunca hay salto ni costura.
    const repsPorTiling = Math.ceil(length / unitWidth);
    if (repsPorTiling > REPS) {
      console.error(
        `[text-loop] REPS=${REPS} no alcanza: se necesitan ${repsPorTiling}. Subir la constante.`,
      );
    }
    const span = repsPorTiling * unitWidth;

    const apply = (offset: number) => {
      const partner = offset >= 0 ? offset - span : offset + span;
      head.setAttribute('startOffset', String(offset));
      tail.setAttribute('startOffset', String(partner));
    };

    apply(0);

    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || speed <= 0) return undefined;

    const state = { offset: 0 };
    const tween = gsap.to(state, {
      offset: direction === 'reverse' ? -span : span,
      duration: span / speed,
      ease: 'none',
      repeat: -1,
      onUpdate: () => apply(state.offset)
    });

    const root = rootRef.current;
    const pause = () => tween.pause();
    const resume = () => tween.resume();

    if (pauseOnHover && root) {
      root.addEventListener('pointerenter', pause);
      root.addEventListener('pointerleave', resume);
    }

    return () => {
      tween.kill();
      if (pauseOnHover && root) {
        root.removeEventListener('pointerenter', pause);
        root.removeEventListener('pointerleave', resume);
      }
    };
  }, [metrics, speed, direction, pauseOnHover]);

  const loopText = unit.repeat(REPS);

  return (
    <div ref={rootRef} className={`relative w-full overflow-hidden ${className}`.trim()} style={style}>
      <svg
        className="block h-full w-full"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={text}
      >
        <path
          ref={pathRef}
          id={pathId}
          d={d}
          fill="none"
          stroke={ribbon ? ribbonColor : 'none'}
          strokeWidth={ribbon ? ribbonWidth : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <text ref={measureRef} className="invisible pointer-events-none" style={textStyle} aria-hidden="true">
          {unit}
        </text>

        <text
          className="select-none"
          style={textStyle}
          fill={color}
          dominantBaseline="central"
          aria-hidden="true"
        >
          <textPath ref={headRef} href={`#${pathId}`} startOffset={0}>
            {loopText}
          </textPath>
        </text>

        <text
          className="select-none"
          style={textStyle}
          fill={color}
          dominantBaseline="central"
          aria-hidden="true"
        >
          <textPath ref={tailRef} href={`#${pathId}`} startOffset={0}>
            {loopText}
          </textPath>
        </text>
      </svg>
    </div>
  );
};

export default TextLoop;
