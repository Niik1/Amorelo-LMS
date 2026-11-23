import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/public/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center overflow-x-clip px-4 py-16 text-center">
      <div className="font-heading text-[clamp(9rem,38vw,17rem)] leading-none font-extrabold text-[#1A73E8] select-none sm:text-[clamp(15rem,66vw,27rem)]">
        <span aria-hidden="true" className="flex items-center justify-center">
          <span>4</span>
          <span className="relative mx-[0.05em] inline-block h-[0.86em] w-[0.86em]">
            <span className="absolute inset-0 rounded-full border-[0.1em] border-[#1A73E8]" />
            <Image
              src="/mascota_404.png"
              alt=""
              width={500}
              height={500}
              priority
              className="absolute bottom-[0.03em] left-1/2 z-10 w-[1.05em] max-w-none -translate-x-1/2"
            />
          </span>
          <span>4</span>
        </span>
        <span className="sr-only">404</span>
      </div>

      <h1 className="font-heading mt-8 max-w-2xl text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
        ¡Vaya! La página que buscas no se ha encontrado
      </h1>

      <p className="text-muted-foreground mt-3">
        Estamos en desarrollo de la página
      </p>

      <Button
        render={<Link href="/" />}
        nativeButton={false}
        className="relative mt-8 overflow-hidden bg-[#1A73E8] pr-2 pl-7 text-[#FFF4E3] transition-colors duration-300 hover:border-[#1A73E8]/40 hover:bg-[#1A73E8] active:bg-[#1A73E8]"
      >
        <span
          aria-hidden="true"
          className="absolute -inset-px origin-right scale-x-0 bg-white transition-transform duration-300 ease-out group-hover/button:scale-x-100 motion-reduce:transition-none"
        />
        <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover/button:text-[#1A73E8]">
          Volver al inicio
          <span
            aria-hidden="true"
            className="inline-flex size-8 items-center justify-center rounded-full bg-white text-[#1A73E8] transition-colors duration-300 group-hover/button:bg-[#1A73E8] group-hover/button:text-white"
          >
            <ArrowRightIcon className="size-4" />
          </span>
        </span>
      </Button>
    </main>
  );
}
