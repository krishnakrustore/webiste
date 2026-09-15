import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
import { useCategories, useOccasions, useFabricTypes } from "../../hooks/useTaxonomy";

export interface FilterState {
  category: string | null;
  fabric: string | null;
  occasion: string | null;
}

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  open: boolean;
  onClose: () => void;
}

function FilterGroup({ title, options, active, onSelect }: { title: string; options: string[]; active: string | null; onSelect: (v: string | null) => void }) {
  return (
    <div className="mb-8">
      <p className="eyebrow text-charcoal/50 mb-3">{title}</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelect(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors duration-250 ${!active ? "bg-wine text-ivory border-wine" : "border-charcoal/15 text-charcoal/65 hover:border-gold"}`}
        >
          All
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors duration-250 ${active === opt ? "bg-wine text-ivory border-wine" : "border-charcoal/15 text-charcoal/65 hover:border-gold"}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterBody({ filters, onChange }: Pick<Props, "filters" | "onChange">) {
  const { categories } = useCategories();
  const { occasions } = useOccasions();
  const { fabricTypes } = useFabricTypes();
  return (
    <>
      <FilterGroup title="Category" options={categories.map((c) => c.name)} active={filters.category} onSelect={(v) => onChange({ ...filters, category: v })} />
      <FilterGroup title="Fabric" options={fabricTypes.map((f) => f.name)} active={filters.fabric} onSelect={(v) => onChange({ ...filters, fabric: v })} />
      <FilterGroup title="Occasion" options={occasions.map((o) => o.name)} active={filters.occasion} onSelect={(v) => onChange({ ...filters, occasion: v })} />
    </>
  );
}

export default function ProductFilters({ filters, onChange, open, onClose }: Props) {
  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="flex items-center gap-2 mb-6 text-charcoal">
          <SlidersHorizontal size={15} />
          <span className="text-sm font-medium">Filter</span>
        </div>
        <FilterBody filters={filters} onChange={onChange} />
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-50 bg-charcoal/45 backdrop-blur-sm" onClick={onClose}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto bg-ivory rounded-t-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-display text-xl">Filters</span>
                <button onClick={onClose} aria-label="Close filters"><X size={20} /></button>
              </div>
              <FilterBody filters={filters} onChange={onChange} />
              <button onClick={onClose} className="w-full mt-2 rounded-full bg-wine text-ivory py-3 text-sm font-medium">
                Show Results
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
