import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useCategories } from "../../hooks/useTaxonomy";
import SectionHeading from "../ui/SectionHeading";

export default function CategoryGrid() {
  const { categories } = useCategories();
  return (
    <section className="py-14 md:py-20 bg-ivory relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[28rem] h-[28rem] rounded-full brand-glow" style={{ opacity: 0.14 }} />
      <div className="max-w-[1440px] mx-auto px-5 md:px-8 relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <SectionHeading eyebrow="Curated for you" title="Shop by Category" />
          <Link to="/collection" className="hidden md:inline-flex items-center gap-2 text-sm text-wine hover:gap-3 transition-all duration-300">
            View all collections <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.slice(0, 8).map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 4) * 0.08 }}
            >
              <Link to={`/collection/${cat.slug}`} className="group block relative overflow-hidden rounded-sm aspect-[3/4]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/10 to-transparent transition-opacity duration-500 group-hover:from-charcoal/85" />
                <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-400 group-hover:-translate-y-1">
                  <p className="font-display text-ivory text-xl md:text-2xl">{cat.name}</p>
                  <p className="text-ivory/65 text-xs mt-1 hidden md:block">{cat.description}</p>
                  <span className="thread-line w-8 mt-3 opacity-0 group-hover:opacity-100 group-hover:w-14 transition-all duration-400" />
                </div>
                <ArrowUpRight
                  size={16}
                  className="absolute top-4 right-4 text-ivory opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-400"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
