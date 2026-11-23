// SplitText con motion: divide el texto en palabras y las revela en cascada
// (fade + subida + blur) una sola vez al entrar al viewport. Sin GSAP: solo
// motion (ya es dependencia del proyecto). Con reduced-motion muestra el
// texto completo directo. El h2/padre conserva sus clases; el componente
// solo parte el contenido en spans animados.

"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045 },
  },
};

const word: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export function SplitText({ text, className }: { text: string; className?: string }) {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");

  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-15% 0px" }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          aria-hidden="true"
          variants={word}
          className="inline-block"
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.span>
  );
}
