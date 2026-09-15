import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useFabricTypes } from "../../hooks/useTaxonomy";
import SectionHeading from "../ui/SectionHeading";

export default function FabricChips() {
  const { fabricTypes } = useFabricTypes();
  return (
    <section className="py-12 md:py-16 bg-offwhite">
      <div className="max-w-[1440px] mx-auto px-5 md:px-8">
        <SectionHeading eyebrow="Explore by weave" title="Fabric Categories" align="center" />
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {fabricTypes.map((fab, i) => (
            <motion.div
              key={fab.slug}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 12) * 0.04 }}
            >
              <Link
                to={`/collection?fabric=${encodeURIComponent(fab.name)}`}
                className="inline-block px-6 py-2.5 rounded-full border border-charcoal/15 text-sm text-charcoal/75 bg-ivory hover:border-gold hover:text-wine hover:bg-champagne/30 transition-all duration-300"
              >
                {fab.name}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
