// Sección de videos (TikTok): titular + carrusel abanico 3D manual
// (drag/swipe, flechas y dots; sin scrollbar, sin autoplay de pista).
// El video central corre solo (muteado por regla de navegadores); tap en él
// alterna el sonido (preferencia global que viaja con el carrusel).
// Las cards pausadas llevan play decorativo; la central, nunca.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/public/button";
import { SocialInstagramIcon } from "@/components/icons/social-instagram";
import { cn } from "cn";

const PROFILE_URL = "https://www.tiktok.com/@eltallerdeamorelo";
// Mismo perfil que el footer (única fuente de la URL de Instagram).
const INSTAGRAM_URL = "https://www.instagram.com/eltallerdeamorelo/";

type Reel = { src: string; poster: string };

function cloudinary(id: string, kind: "video" | "poster") {
  if (kind === "poster")
    return `https://res.cloudinary.com/ynlbrqmb/video/upload/so_2,q_auto,f_auto,w_640/${id}.jpg`;
  // SIN transformación: Cloudinary te re-encodea con q_auto y el archivo
  // sale hasta 60% más pesado que el original subido (medido: q_auto
  // 16.1 MB total vs 9.8 MB sirviendo el origen 576x1024 sin tocar).
  // OJO: los ids ya traen su propia versión (v1791608045/...).
  return `https://res.cloudinary.com/ynlbrqmb/video/upload/${id}.mp4`;
}

const REELS: Reel[] = [
  "v1791608045/nsemhbelshfmmi4z5azs",
  "v1791608083/fvjmu89dqslz0mpwkq1m",
  "v1791608090/kfbx3gzypxubbzyfmeen",
  "v1791608097/iam4h2z5reqo7znneccs",
  "v1791608105/umptarv5q4uhufz7xho3",
  "v1791608112/sur2hkcx9bb4h5glygyt",
].map((id) => ({
  src: cloudinary(id, "video"),
  poster: cloudinary(id, "poster"),
}));

const COUNT = REELS.length;
const TAP_PX = 10;
const DRAG_PX = 50;

const PASTELS = [
  "bg-pink",
  "bg-lilac",
  "bg-cream",
  "bg-[#C7D8F5]",
  "bg-[#F8D3A3]",
  "bg-[#F6A5C0]",
] as const;

function fanStyle(offset: number, reduceMotion: boolean) {
  const abs = Math.abs(offset);
  return {
    transform: `translateX(${offset * 62}%) scale(${1 - 0.13 * abs}) rotate(${offset * 7}deg)`,
    zIndex: 10 - abs,
    opacity: abs <= 2 ? 1 : 0,
    filter: abs === 0 ? "none" : `brightness(${1 - 0.18 * abs})`,
    transition: reduceMotion
      ? undefined
      : "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.55s, filter 0.55s",
    pointerEvents: (abs === 0 ? "auto" : "none") as "auto" | "none",
  };
}

export function Reels() {
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const reduceMotion = useReducedMotion();
  const downX = useRef<number | null>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  // React no siempre refleja `muted` en el HTML SSR (rompe el autoplay
  // inicial); el ref con defaultMuted + esta sincronización lo garantizan.
  useEffect(() => {
    videos.current.forEach((v, j) => {
      if (!v) return;
      v.muted = j === active ? muted : true;
    });
  });

  const pauseAll = () => {
    videos.current.forEach((v) => v?.pause());
  };

  const go = (dir: 1 | -1) => {
    pauseAll();
    setActive((a) => (a + dir + COUNT) % COUNT);
  };

  const select = (i: number) => {
    if (i === active) return;
    pauseAll();
    setActive(i);
  };

  // El activo corre solo al montarse/cambiar y cuando la sección es visible.
  useEffect(() => {
    const section = document.querySelector("#videos");
    if (!section) return;
    const playActive = () => {
      videos.current.forEach((v, j) => {
        if (j === active) void v?.play().catch(() => {});
        else v?.pause();
      });
    };
    playActive();
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) playActive();
        else pauseAll();
      },
      { threshold: 0.1 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, [active]);

  const offsetOf = (i: number) => {
    let d = (i - active + COUNT) % COUNT;
    if (d > COUNT / 2) d -= COUNT;
    return d;
  };

  return (
    <section
      id="videos"
      aria-labelledby="reels-title"
      className="sm:bg-bg-alt scroll-mt-20 overflow-x-clip bg-[#1A73E8] sm:px-2 sm:pt-10 sm:pb-20 lg:px-4"
    >
      <div className="mx-auto w-full max-w-[1500px] px-6 pt-16 pb-24 sm:overflow-x-clip sm:rounded-[2.5rem] sm:bg-[#1A73E8] sm:px-10 sm:pt-20 sm:pb-20 lg:px-14">
        <h2
          id="reels-title"
          className="font-heading text-4xl leading-[1.08] font-extrabold tracking-tight text-balance text-[#FFF4E3] sm:text-5xl"
        >
          Mira cómo trabajo
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-pretty text-white sm:text-lg">
          Algunos de mis videos en TikTok: técnicas, armados y detalles
          terminados.
        </p>

        {/* Pista con drag (sin scrollbar visible). */}
        <div
          className="relative mt-10 h-[440px] touch-pan-y select-none sm:h-[520px]"
          onPointerDown={(e) => {
            downX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (downX.current === null) return;
            const dx = e.clientX - downX.current;
            downX.current = null;
            if (dx <= -DRAG_PX) go(1);
            else if (dx >= DRAG_PX) go(-1);
            // Tap (sin arrastre) sobre la card activa: alterna el sonido.
            else if (Math.abs(dx) < TAP_PX) {
              const card = (e.target as Element).closest("[data-reel]");
              if (card?.getAttribute("data-active") === "true") {
                setMuted((m) => !m);
              }
            }
          }}
          onPointerCancel={() => {
            downX.current = null;
          }}
        >
          {REELS.map((reel, i) => {
            const offset = offsetOf(i);
            const isActive = offset === 0;
            return (
              <div
                key={reel.src}
                data-reel={i}
                data-active={isActive}
                aria-hidden={!isActive}
                className="absolute top-0 left-1/2 -ml-28 w-56 sm:-ml-32 sm:w-64"
                style={fanStyle(offset, !!reduceMotion)}
              >
                <div
                  className={cn(
                    "border-text-heading relative aspect-[9/16] w-full overflow-hidden rounded-3xl border-4",
                    PASTELS[i % PASTELS.length],
                  )}
                >
                  <video
                    ref={(el) => {
                      videos.current[i] = el;
                      if (el) el.defaultMuted = true;
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                    src={reel.src}
                    poster={reel.poster}
                    // Sin autoPlay attr: con muted el navegador autorarranca
                    // las 6 y descarga todos los MP4 (~10 MB) aunque nadie
                    // las vea. Todo el play lo controla playActive() (center
                    // only) + el IntersectionObserver. preload="none" evita
                    // que los no activos pidan nada.
                    preload="none"
                    muted
                    loop
                    playsInline
                    aria-label={`Video ${i + 1} de TikTok`}
                  />
                  {/* Play decorativo solo en pausadas (sin acción). */}
                  {!isActive && (
                    <span
                      aria-hidden="true"
                      className="border-text-heading pointer-events-none absolute top-1/2 left-1/2 inline-flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-white"
                    >
                      <PlayIcon
                        className="fill-text-heading text-text-heading size-5"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                  {/* Pista de tap-sonido solo en la activa y muteada. */}
                  {isActive && muted && (
                    <span
                      aria-hidden="true"
                      className="bg-text-heading/80 pointer-events-none absolute top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white"
                    >
                      <VolumeXIcon className="size-3.5" aria-hidden="true" />
                      Toca para activar el sonido
                    </span>
                  )}
                  {isActive && !muted && (
                    <span
                      aria-hidden="true"
                      className="bg-text-heading/80 pointer-events-none absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full text-white"
                    >
                      <Volume2Icon className="size-4" aria-hidden="true" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Flechas (siempre visibles, táctiles en mobile). */}
          <button
            type="button"
            aria-label="Video anterior"
            onClick={() => go(-1)}
            className="group/arrow border-text-heading absolute top-1/2 left-0 z-20 hidden size-11 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 bg-[#FFF4E3] text-[#1A73E8] transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:left-6 sm:inline-flex"
          >
            <span
              aria-hidden="true"
              className="absolute -inset-px origin-left scale-x-0 bg-[#1F3A6E] transition-transform duration-300 ease-out group-hover/arrow:scale-x-100 motion-reduce:transition-none"
            />
            <ChevronLeftIcon
              aria-hidden="true"
              className="relative z-10 transition-colors duration-300 group-hover/arrow:text-white"
            />
          </button>
          <button
            type="button"
            aria-label="Video siguiente"
            onClick={() => go(1)}
            className="group/arrow border-text-heading absolute top-1/2 right-0 z-20 hidden size-11 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 bg-[#FFF4E3] text-[#1A73E8] transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:right-6 sm:inline-flex"
          >
            <span
              aria-hidden="true"
              className="absolute -inset-px origin-right scale-x-0 bg-[#1F3A6E] transition-transform duration-300 ease-out group-hover/arrow:scale-x-100 motion-reduce:transition-none"
            />
            <ChevronRightIcon
              aria-hidden="true"
              className="relative z-10 transition-colors duration-300 group-hover/arrow:text-white"
            />
          </button>
        </div>

        {/* Dots (sin scrollbar). */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {REELS.map((reel, i) => (
            <button
              key={reel.src}
              type="button"
              aria-label={`Ir al video ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => select(i)}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                i === active
                  ? "w-8 bg-[#FFF4E3]"
                  : "w-2.5 bg-[#FFF4E3]/40 hover:bg-[#FFF4E3]/70",
              )}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button
            render={
              <Link
                href={PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            nativeButton={false}
            className="relative h-12 overflow-hidden bg-white pr-2 pl-8 text-lg text-[#1F3A6E] transition-colors duration-300 hover:bg-white active:bg-white"
          >
            <span
              aria-hidden="true"
              className="absolute -inset-px origin-right scale-x-0 bg-[#1F3A6E] transition-transform duration-300 ease-out group-hover/button:scale-x-100 motion-reduce:transition-none"
            />
            <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover/button:text-white">
              Ver más en TikTok
              <span
                aria-hidden="true"
                className="inline-flex size-9 items-center justify-center rounded-full bg-[#1F3A6E] text-white transition-colors duration-300 group-hover/button:bg-white group-hover/button:text-[#1F3A6E]"
              >
                <ArrowRightIcon className="size-4" />
              </span>
            </span>
          </Button>

          {/* Gemelo del botón de TikTok: mismo estilo, ícono social. */}
          <Button
            render={
              <Link
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            nativeButton={false}
            className="relative h-12 overflow-hidden bg-white pr-2 pl-8 text-lg text-[#1F3A6E] transition-colors duration-300 hover:bg-white active:bg-white"
          >
            <span
              aria-hidden="true"
              className="absolute -inset-px origin-right scale-x-0 bg-[#1F3A6E] transition-transform duration-300 ease-out group-hover/button:scale-x-100 motion-reduce:transition-none"
            />
            <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover/button:text-white">
              Ver más en Instagram
              <span
                aria-hidden="true"
                className="inline-flex size-9 items-center justify-center rounded-full bg-[#1F3A6E] text-white transition-colors duration-300 group-hover/button:bg-white group-hover/button:text-[#1F3A6E]"
              >
                <SocialInstagramIcon className="size-4" />
              </span>
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}
