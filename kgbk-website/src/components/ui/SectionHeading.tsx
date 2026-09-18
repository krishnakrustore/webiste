import { motion } from "framer-motion";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
}

export default function SectionHeading({ eyebrow, title, subtitle, align = "left", light = false }: Props) {
  const isCenter = align === "center";
  return (
    <div className={isCenter ? "text-center mx-auto max-w-2xl" : "text-left"}>
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`eyebrow mb-3 ${light ? "text-gold-light" : "text-gold"}`}
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className={`font-display text-4xl md:text-5xl leading-[1.1] ${light ? "text-ivory" : "text-charcoal"}`}
      >
        {title}
      </motion.h2>
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className={`thread-line w-16 mt-5 ${isCenter ? "mx-auto" : ""}`}
      />
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className={`mt-5 text-base leading-relaxed ${light ? "text-ivory/70" : "text-charcoal/65"}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
