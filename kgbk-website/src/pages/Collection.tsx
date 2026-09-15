import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, Search as SearchIcon } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useTaxonomy";
import ProductCard from "../components/product/ProductCard";
import ProductFilters, { type FilterState } from "../components/product/ProductFilters";

export default function Collection() {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const [filters, setFilters] = useState<FilterState>({ category: null, fabric: null, occasion: null });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const categoryDef = categories.find((c) => c.slug === categorySlug);

  useEffect(() => {
    const fromSlug = categoryDef?.name ?? null;
    const fabricParam = searchParams.get("fabric");
    const occasionParam = searchParams.get("occasion");
    setFilters({ category: fromSlug, fabric: fabricParam, occasion: occasionParam });
    const qParam = searchParams.get("q");
    if (qParam) setQuery(qParam);
  }, [categoryDef, searchParams]);

  useEffect(() => {
    document.title = `${categoryDef ? categoryDef.name : "All Collections"} | Krishna Gari Battala Kottu`;
  }, [categoryDef]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filters.category && p.category !== filters.category) return false;
      if (filters.fabric && p.subcategory !== filters.fabric && p.material !== filters.fabric) return false;
      if (filters.occasion && p.occasion !== filters.occasion) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.material.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [products, filters, query]);

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-8 py-6 md:py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-5 md:mb-6">
        <p className="eyebrow text-gold mb-2">Collection</p>
        <h1 className="font-display text-4xl md:text-5xl">{categoryDef ? categoryDef.name : "All Collections"}</h1>
        {categoryDef && <p className="text-charcoal/60 mt-3 max-w-lg">{categoryDef.description}</p>}
      </motion.div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5 max-w-xl">
        <div className="relative flex-1">
          <SearchIcon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search within this collection..."
            className="w-full bg-beige/40 border border-charcoal/10 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
          />
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden inline-flex items-center justify-center gap-2 rounded-full border border-charcoal/15 px-5 py-2.5 text-sm shrink-0"
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      <div className="flex gap-10">
        <ProductFilters filters={filters} onChange={setFilters} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <div className="flex-1">
          <p className="text-xs text-charcoal/45 mb-6">{filtered.length} piece{filtered.length !== 1 ? "s" : ""}</p>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-sm bg-beige animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
              <p className="font-display text-2xl mb-3">New collections are being curated</p>
              <p className="text-charcoal/55 mb-8">Please check back soon, or reach out and we&rsquo;ll help you find the right piece.</p>
              <button onClick={() => setFilters({ category: null, fabric: null, occasion: null })} className="rounded-full border border-wine text-wine px-6 py-3 text-sm hover:bg-wine hover:text-ivory transition-colors">
                Explore Other Collections
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
