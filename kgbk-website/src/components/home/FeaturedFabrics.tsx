import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";
import ProductCard from "../product/ProductCard";
import { useProducts } from "../../hooks/useProducts";

export default function FeaturedFabrics() {
  const { products, loading } = useProducts();
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const fallback = products.slice(0, 4);
  const items = featured.length > 0 ? featured : fallback;

  return (
    <section className="py-14 md:py-20 bg-offwhite">
      <div className="max-w-[1440px] mx-auto px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <SectionHeading
            eyebrow="Handpicked"
            title="Featured Fabrics"
            subtitle="Discover textures, colours and craftsmanship curated for your next creation."
          />
          <Link to="/collection" className="hidden md:inline-flex items-center gap-2 text-sm text-wine hover:gap-3 transition-all duration-300 shrink-0">
            View all fabrics <ArrowUpRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-sm bg-beige animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}

        <div className="mt-10 md:hidden text-center">
          <Link to="/collection" className="inline-flex items-center gap-2 text-sm text-wine">
            View all fabrics <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
