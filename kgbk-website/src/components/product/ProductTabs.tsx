import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ProductTab {
  label: string;
  content: string[];
}

export default function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex gap-6 border-b border-charcoal/10 overflow-x-auto scrollbar-none">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`relative py-3 text-sm font-medium whitespace-nowrap transition-colors duration-250 ${
              active === i ? "text-wine" : "text-charcoal/50 hover:text-charcoal/80"
            }`}
          >
            {tab.label}
            {active === i && (
              <motion.span layoutId="product-tab-underline" className="absolute left-0 right-0 -bottom-px h-[2px] bg-wine" />
            )}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.ul
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="pt-5 space-y-2.5"
        >
          {tabs[active]?.content.map((line, i) => (
            <li key={i} className="text-sm text-charcoal/65 leading-relaxed flex gap-2.5">
              <span className="text-gold mt-1.5 w-1 h-1 rounded-full bg-gold shrink-0" />
              {line}
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}
