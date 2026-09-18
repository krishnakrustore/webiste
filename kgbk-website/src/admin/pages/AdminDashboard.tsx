import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Package, Star, CheckCircle2, Layers, IndianRupee } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useTaxonomy";
import { AdminOrdersApi } from "../../api/admin";
import type { Order } from "../../types/product";
import { Link } from "react-router-dom";

const REVENUE_STATUSES = new Set(["paid", "shipped", "delivered"]);

function monthlyOverview(orders: Order[], months = 6) {
  const now = new Date();
  const buckets: { key: string; label: string; revenue: number; sales: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      revenue: 0,
      sales: 0,
    });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const o of orders) {
    if (!REVENUE_STATUSES.has(o.status)) continue;
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.revenue += o.total;
      bucket.sales += 1;
    }
  }
  return buckets;
}

export default function AdminDashboard() {
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    document.title = "Dashboard | Admin";
    AdminOrdersApi.list().then(setOrders).catch(() => setOrders([]));
  }, []);

  const overview = useMemo(() => monthlyOverview(orders), [orders]);
  const maxRevenue = Math.max(1, ...overview.map((b) => b.revenue));
  const totalRevenue = overview.reduce((sum, b) => sum + b.revenue, 0);
  const totalSales = overview.reduce((sum, b) => sum + b.sales, 0);

  const stats = useMemo(() => {
    const total = products.length;
    const featured = products.filter((p) => p.featured).length;
    const available = products.filter((p) => p.availability === "Available").length;
    const categoriesUsed = new Set(products.map((p) => p.category)).size;
    return [
      { label: "Total Products", value: total, icon: Package },
      { label: "Featured Products", value: featured, icon: Star },
      { label: "Available Products", value: available, icon: CheckCircle2 },
      { label: "Categories", value: `${categoriesUsed}/${categories.length}`, icon: Layers },
    ];
  }, [products, categories.length]);

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-charcoal/50 mt-1">Overview of your product catalogue.</p>
        </div>
        <Link to="/admin/products/new" className="rounded-lg bg-wine text-ivory px-5 py-2.5 text-sm font-medium hover:bg-wine-dark transition-colors">
          + Add Product
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="bg-white rounded-xl p-5 border border-charcoal/5 shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-wine/10 flex items-center justify-center mb-4">
              <s.icon size={17} className="text-wine" />
            </div>
            <p className="text-2xl font-semibold">{loading ? "-" : s.value}</p>
            <p className="text-xs text-charcoal/50 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-charcoal/5 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold">Sales &amp; Revenue Overview</h2>
            <p className="text-xs text-charcoal/45 mt-1">Last 6 months &middot; paid, shipped &amp; delivered orders</p>
          </div>
          <div className="flex items-center gap-5 text-right">
            <div>
              <p className="text-lg font-semibold flex items-center gap-0.5 justify-end"><IndianRupee size={14} />{totalRevenue.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-charcoal/45">Total revenue</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{totalSales}</p>
              <p className="text-[11px] text-charcoal/45">Orders</p>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-4 h-44 px-1">
          {overview.map((b, i) => (
            <motion.div
              key={b.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
            >
              <p className="text-[11px] text-charcoal/55 font-medium">
                {b.revenue > 0 ? `₹${b.revenue.toLocaleString("en-IN")}` : "–"}
              </p>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(4, (b.revenue / maxRevenue) * 100)}%` }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="w-full rounded-t-md bg-gradient-to-t from-wine to-wine/70 min-h-1"
              />
              <div className="text-center">
                <p className="text-xs font-medium text-charcoal">{b.label}</p>
                <p className="text-[10px] text-charcoal/40">{b.sales} order{b.sales !== 1 ? "s" : ""}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-charcoal/5 p-6">
        <h2 className="text-sm font-semibold mb-4">Recently Added</h2>
        <div className="divide-y divide-charcoal/5">
          {products.slice(0, 5).map((p) => (
            <Link key={p.id} to={`/admin/products/${p.id}/edit`} className="flex items-center gap-4 py-3 hover:bg-beige/20 -mx-2 px-2 rounded-lg transition-colors">
              <img src={p.images[0]?.src} alt="" className="w-10 h-12 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-charcoal/45">{p.category}</p>
              </div>
              <span className="text-sm text-charcoal/60">&#8377;{p.price.toLocaleString("en-IN")}</span>
            </Link>
          ))}
          {products.length === 0 && !loading && <p className="text-sm text-charcoal/40 py-6 text-center">No products yet.</p>}
        </div>
      </div>
    </div>
  );
}
