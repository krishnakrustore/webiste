import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Pencil, Trash2, Search, Plus, Eye, EyeOff } from "lucide-react";
import { useAdminProducts } from "../../hooks/useProducts";
import { useCategories, useFabricTypes, useOccasions } from "../../hooks/useTaxonomy";
import { ProductRepository } from "../../storage/ProductRepository";
import { ApiError } from "../../api/client";
import type { Product } from "../../types/product";

type StatusTab = "all" | "draft" | "published";
const TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "published", label: "Published" },
];

const selectClass = "bg-white border border-charcoal/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold";

export default function AdminProductTable() {
  const { products, loading, reload } = useAdminProducts();
  const { categories } = useCategories();
  const { fabricTypes } = useFabricTypes();
  const { occasions } = useOccasions();
  const [params, setParams] = useSearchParams();
  const tab = (["draft", "published"].includes(params.get("status") ?? "") ? params.get("status") : "all") as StatusTab;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [fabric, setFabric] = useState("");
  const [occasion, setOccasion] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ ids: string[]; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Products | Admin";
  }, []);

  const counts = useMemo(
    () => ({ all: products.length, draft: products.filter((p) => p.status === "draft").length, published: products.filter((p) => p.status !== "draft").length }),
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (tab === "draft" && p.status !== "draft") return false;
      if (tab === "published" && p.status === "draft") return false;
      if (category && p.category !== category) return false;
      if (fabric && p.subcategory !== fabric) return false;
      if (occasion && p.occasion !== occasion) return false;
      return !q || [p.name, p.sku ?? "", p.color, p.material].join(" ").toLowerCase().includes(q);
    });
  }, [products, tab, category, fabric, occasion, query]);

  // Drop selections that are no longer visible after filtering.
  useEffect(() => {
    setSelected((s) => new Set([...s].filter((id) => filtered.some((p) => p.id === id))));
  }, [filtered]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(ids: string[], action: "publish" | "unpublish" | "delete") {
    setBusy(true);
    setError("");
    try {
      await ProductRepository.bulk(ids, action);
      setSelected(new Set());
      setConfirm(null);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const selectedIds = [...selected];

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-charcoal/50 mt-1">Drafts are hidden from the website until published.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/import" className="inline-flex items-center gap-2 rounded-lg border border-wine text-wine px-5 py-2.5 text-sm font-medium hover:bg-wine hover:text-ivory transition-colors">
            Bulk Import
          </Link>
          <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-lg bg-wine text-ivory px-5 py-2.5 text-sm font-medium hover:bg-wine-dark transition-colors">
            <Plus size={15} /> Add Product
          </Link>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-charcoal/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setParams(t.key === "all" ? {} : { status: t.key })}
            className={`px-4 py-2.5 text-sm -mb-px border-b-2 transition-colors ${tab === t.key ? "border-wine text-wine font-medium" : "border-transparent text-charcoal/55 hover:text-charcoal"}`}
          >
            {t.label} <span className="text-xs text-charcoal/40">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, colour, fabric..."
            className="w-full bg-white border border-charcoal/10 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>
        <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
        </select>
        <select className={selectClass} value={fabric} onChange={(e) => setFabric(e.target.value)} aria-label="Fabric">
          <option value="">All fabrics</option>
          {fabricTypes.map((f) => <option key={f.slug} value={f.name}>{f.name}</option>)}
        </select>
        <select className={selectClass} value={occasion} onChange={(e) => setOccasion(e.target.value)} aria-label="Occasion">
          <option value="">All occasions</option>
          {occasions.map((o) => <option key={o.slug} value={o.name}>{o.name}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 bg-charcoal text-ivory rounded-lg px-4 py-3 mb-4 shadow-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button disabled={busy} onClick={() => runBulk(selectedIds, "publish")} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-sm hover:bg-emerald-700 disabled:opacity-50">
            <Eye size={14} /> Publish
          </button>
          <button disabled={busy} onClick={() => runBulk(selectedIds, "unpublish")} className="inline-flex items-center gap-1.5 rounded-md bg-ivory/15 px-3.5 py-1.5 text-sm hover:bg-ivory/25 disabled:opacity-50">
            <EyeOff size={14} /> Move to drafts
          </button>
          <button disabled={busy} onClick={() => setConfirm({ ids: selectedIds, label: `${selected.size} products` })} className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3.5 py-1.5 text-sm hover:bg-red-700 disabled:opacity-50">
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-ivory/70 hover:text-ivory">Clear</button>
        </div>
      )}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="bg-white rounded-xl border border-charcoal/5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal/5 text-left text-xs text-charcoal/45 uppercase tracking-wider">
              <th className="pl-5 py-3.5 w-8">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)))}
                  className="w-4 h-4 accent-[#5c1626]"
                />
              </th>
              <th className="px-5 py-3.5 font-medium">Product</th>
              <th className="px-5 py-3.5 font-medium hidden md:table-cell">Category</th>
              <th className="px-5 py-3.5 font-medium hidden lg:table-cell">Fabric / Colour</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
              <th className="px-5 py-3.5 font-medium hidden sm:table-cell">Featured</th>
              <th className="px-5 py-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-5 py-10 text-center text-charcoal/40">Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-charcoal/40">No products found.</td></tr>}
            {filtered.map((p, i) => (
              <Row key={p.id} product={p} index={i} checked={selected.has(p.id)} onToggle={() => toggle(p.id)} onDelete={() => setConfirm({ ids: [p.id], label: `"${p.name}"` })} onTogglePublish={() => runBulk([p.id], p.status === "draft" ? "publish" : "unpublish")} busy={busy} />
            ))}
          </tbody>
        </table>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center px-5" onClick={() => setConfirm(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-6 max-w-sm w-full">
            <p className="font-medium mb-2">Delete {confirm.label}?</p>
            <p className="text-sm text-charcoal/55 mb-6">This permanently removes the products and their images.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-lg border border-charcoal/15 py-2.5 text-sm">Cancel</button>
              <button disabled={busy} onClick={() => runBulk(confirm.ids, "delete")} className="flex-1 rounded-lg bg-red-600 text-white py-2.5 text-sm disabled:opacity-50">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Row({ product: p, index, checked, onToggle, onDelete, onTogglePublish, busy }: {
  product: Product;
  index: number;
  checked: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  busy: boolean;
}) {
  const draft = p.status === "draft";
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index, 20) * 0.02 }}
      className={`border-b border-charcoal/5 last:border-0 transition-colors ${checked ? "bg-champagne/20" : "hover:bg-beige/15"}`}
    >
      <td className="pl-5 py-3">
        <input type="checkbox" aria-label={`Select ${p.name}`} checked={checked} onChange={onToggle} className="w-4 h-4 accent-[#5c1626]" />
      </td>
      <td className="px-5 py-3">
        <Link to={`/admin/products/${p.id}/edit`} className="flex items-center gap-3 group">
          <img src={p.images[0]?.src} alt="" className="w-10 h-12 object-cover rounded bg-beige" />
          <span className="font-medium truncate max-w-[220px] group-hover:text-wine">{p.name}</span>
        </Link>
      </td>
      <td className="px-5 py-3 hidden md:table-cell text-charcoal/60">{p.category}</td>
      <td className="px-5 py-3 hidden lg:table-cell text-charcoal/60 text-xs">
        {p.subcategory || p.material || "--"}
        {p.color && <span className="block text-charcoal/40">{p.color}</span>}
      </td>
      <td className="px-5 py-3">
        <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded ${draft ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
          {draft ? "Draft" : "Published"}
        </span>
      </td>
      <td className="px-5 py-3 hidden sm:table-cell">{p.featured ? "★" : "–"}</td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            disabled={busy}
            onClick={onTogglePublish}
            title={draft ? "Publish" : "Move to drafts"}
            className="p-2 rounded-lg hover:bg-beige/40 text-charcoal/60 hover:text-wine transition-colors disabled:opacity-40"
          >
            {draft ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <Link to={`/admin/products/${p.id}/edit`} title="Edit" className="p-2 rounded-lg hover:bg-beige/40 text-charcoal/60 hover:text-wine transition-colors">
            <Pencil size={14} />
          </Link>
          <button onClick={onDelete} title="Delete" className="p-2 rounded-lg hover:bg-red-50 text-charcoal/60 hover:text-red-600 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
