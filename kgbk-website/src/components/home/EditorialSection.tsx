import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

interface Props {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  cta: { label: string; to: string };
  reverse?: boolean;
}

export default function EditorialSection({ eyebrow, title, body, image, cta, reverse = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <section ref={ref} className="py-12 md:py-16 bg-ivory overflow-hidden">
      <div className={`max-w-[1440px] mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
        <motion.div
          initial={{ opacity: 0, x: reverse ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-sm aspect-[4/5] min-w-0"
        >
          <motion.img src={image} alt="" style={{ y }} className="absolute inset-0 w-full h-[112%] -top-[6%] object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: reverse ? -40 : 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="min-w-0"
        >
          <p className="eyebrow text-gold mb-4">{eyebrow}</p>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.1] mb-6">{title}</h2>
          <span className="thread-line w-16 mb-6 block" />
          <p className="text-charcoal/65 leading-relaxed mb-8 max-w-md">{body}</p>
          <Link to={cta.to} className="group inline-flex items-center gap-2 text-sm font-medium text-wine border-b border-wine/30 pb-1 hover:border-wine transition-colors duration-300">
            {cta.label}
            <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
