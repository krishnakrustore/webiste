import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Pencil, Trash2, Search, Plus } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { ProductRepository } from "../../storage/ProductRepository";

export default function AdminProductTable() {
  const { products, loading, reload } = useProducts();
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Products | Admin";
  }, []);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  async function handleDelete(id: string) {
    await ProductRepository.deleteProduct(id);
    setConfirmDelete(null);
    reload();
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-charcoal/50 mt-1">{products.length} total</p>
        </div>
        <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-lg bg-wine text-ivory px-5 py-2.5 text-sm font-medium hover:bg-wine-dark transition-colors">
          <Plus size={15} /> Add Product
        </Link>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full bg-white border border-charcoal/10 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-gold"
        />
      </div>

      <div className="bg-white rounded-xl border border-charcoal/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal/5 text-left text-xs text-charcoal/45 uppercase tracking-wider">
              <th className="px-5 py-3.5 font-medium">Product</th>
              <th className="px-5 py-3.5 font-medium hidden lg:table-cell">SKU</th>
              <th className="px-5 py-3.5 font-medium hidden md:table-cell">Category</th>
              <th className="px-5 py-3.5 font-medium">Price</th>
              <th className="px-5 py-3.5 font-medium hidden sm:table-cell">Availability</th>
              <th className="px-5 py-3.5 font-medium hidden sm:table-cell">Featured</th>
              <th className="px-5 py-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-charcoal/40">Loading...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-charcoal/40">No products found.</td></tr>
            )}
            {filtered.map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-charcoal/5 last:border-0 hover:bg-beige/15 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.images[0]?.src} alt="" className="w-9 h-11 object-cover rounded" />
                    <span className="font-medium truncate max-w-[160px]">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 hidden lg:table-cell text-charcoal/45 text-xs">{p.sku ?? "–"}</td>
                <td className="px-5 py-3 hidden md:table-cell text-charcoal/60">{p.category}</td>
                <td className="px-5 py-3 text-charcoal/70">&#8377;{p.price.toLocaleString("en-IN")}</td>
                <td className="px-5 py-3 hidden sm:table-cell">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.availability === "Available" ? "bg-green-100 text-green-800" : "bg-charcoal/10 text-charcoal/60"}`}>
                    {p.availability}
                  </span>
                </td>
                <td className="px-5 py-3 hidden sm:table-cell">{p.featured ? "\u2605" : "\u2013"}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/admin/products/${p.id}/edit`} className="p-2 rounded-lg hover:bg-beige/40 text-charcoal/60 hover:text-wine transition-colors">
                      <Pencil size={14} />
                    </Link>
                    <button onClick={() => setConfirmDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-charcoal/60 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center px-5" onClick={() => setConfirmDelete(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-6 max-w-sm w-full">
            <p className="font-medium mb-2">Delete this product?</p>
            <p className="text-sm text-charcoal/55 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-lg border border-charcoal/15 py-2.5 text-sm">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 rounded-lg bg-red-600 text-white py-2.5 text-sm">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
