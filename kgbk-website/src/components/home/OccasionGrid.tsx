import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useOccasions } from "../../hooks/useTaxonomy";
import SectionHeading from "../ui/SectionHeading";

export default function OccasionGrid() {
  const { occasions } = useOccasions();
  return (
    <section className="py-14 md:py-20 bg-beige/40">
      <div className="max-w-[1440px] mx-auto px-5 md:px-8">
        <SectionHeading eyebrow="Every moment" title="Shop by Occasion" align="center" />
        <div className="mt-14 flex gap-4 overflow-x-auto pb-4 md:pb-0 md:grid md:grid-cols-4 md:gap-5 snap-x snap-mandatory scrollbar-none">
          {occasions.map((occ, i) => (
            <motion.div
              key={occ.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className="snap-start shrink-0 w-[68vw] sm:w-64 md:w-auto"
            >
              <Link to={`/collection?occasion=${encodeURIComponent(occ.name)}`} className="group block relative overflow-hidden rounded-sm aspect-[3/4]">
                <img src={occ.image} alt={occ.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.07]" />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent transition-opacity duration-400 group-hover:from-charcoal/95" />
                <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-400 group-hover:-translate-y-1">
                  <p className="font-display text-ivory text-xl">{occ.name}</p>
                  <span className="thread-line w-0 group-hover:w-12 mt-2 transition-all duration-400" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
