import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Package, Star, FileClock, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useTaxonomy";

export default function AdminDashboard() {
  const { products, loading } = useAdminProducts();
  const { categories } = useCategories();

  useEffect(() => {
    document.title = "Dashboard | Admin";
  }, []);

  const drafts = useMemo(() => products.filter((p) => p.status === "draft"), [products]);
  const published = useMemo(() => products.filter((p) => p.status !== "draft"), [products]);

  const stats = [
    { label: "Live Products", value: published.length, icon: Package, to: "/admin/products?status=published" },
    { label: "Drafts to Review", value: drafts.length, icon: FileClock, to: "/admin/products?status=draft" },
    { label: "Featured", value: published.filter((p) => p.featured).length, icon: Star, to: "/admin/products" },
    { label: "Categories in Use", value: `${new Set(published.map((p) => p.category)).size}/${categories.length}`, icon: Layers, to: "/admin/catalogue" },
  ];

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-charcoal/50 mt-1">Overview of your catalogue.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/import" className="rounded-lg border border-wine text-wine px-5 py-2.5 text-sm font-medium hover:bg-wine hover:text-ivory transition-colors">
            Bulk Import
          </Link>
          <Link to="/admin/products/new" className="rounded-lg bg-wine text-ivory px-5 py-2.5 text-sm font-medium hover:bg-wine-dark transition-colors">
            + Add Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}>
            <Link to={s.to} className="block bg-white rounded-xl p-5 border border-charcoal/5 shadow-sm hover:border-gold/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-wine/10 flex items-center justify-center mb-4">
                <s.icon size={17} className="text-wine" />
              </div>
              <p className="text-2xl font-semibold">{loading ? "-" : s.value}</p>
              <p className="text-xs text-charcoal/50 mt-1">{s.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {drafts.length > 0 && (
        <div className="bg-champagne/20 border border-gold/30 rounded-xl p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <strong>{drafts.length}</strong> draft product{drafts.length !== 1 ? "s" : ""} waiting for review. Drafts are hidden from the website until you publish them.
          </p>
          <Link to="/admin/products?status=draft" className="text-sm font-medium text-wine hover:underline">Review drafts &rarr;</Link>
        </div>
      )}

      <div className="bg-white rounded-xl border border-charcoal/5 p-6">
        <h2 className="text-sm font-semibold mb-4">Recently Added</h2>
        <div className="divide-y divide-charcoal/5">
          {products.slice(0, 6).map((p) => (
            <Link key={p.id} to={`/admin/products/${p.id}/edit`} className="flex items-center gap-4 py-3 hover:bg-beige/20 -mx-2 px-2 rounded-lg transition-colors">
              <img src={p.images[0]?.src} alt="" className="w-10 h-12 object-cover rounded bg-beige" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-charcoal/45">{p.category}</p>
              </div>
              {p.status === "draft" && <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Draft</span>}
            </Link>
          ))}
          {products.length === 0 && !loading && <p className="text-sm text-charcoal/40 py-6 text-center">No products yet.</p>}
        </div>
      </div>
    </div>
  );
}
