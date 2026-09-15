import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Heart, Package } from "lucide-react";
import { api } from "../../api/client";

interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  orderCount: number;
  wishlistCount: number;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Customers | Admin";
    api.get<AdminCustomer[]>("/customers", true).then((data) => {
      setCustomers(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl font-semibold mb-2">Customers</h1>
      <p className="text-sm text-charcoal/50 mb-8">{customers.length} registered accounts.</p>

      <div className="bg-white rounded-xl border border-charcoal/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal/5 text-left text-xs text-charcoal/45 uppercase tracking-wider">
              <th className="px-5 py-3.5 font-medium">Customer</th>
              <th className="px-5 py-3.5 font-medium hidden md:table-cell">Contact</th>
              <th className="px-5 py-3.5 font-medium">Orders</th>
              <th className="px-5 py-3.5 font-medium">Wishlist</th>
              <th className="px-5 py-3.5 font-medium hidden sm:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-5 py-10 text-center text-charcoal/40">Loading...</td></tr>}
            {!loading && customers.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-charcoal/40">No registered customers yet.</td></tr>}
            {customers.map((c, i) => (
              <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-charcoal/5 last:border-0 hover:bg-beige/15 transition-colors">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 hidden md:table-cell text-charcoal/60">
                  <div className="flex items-center gap-1.5 mb-1"><Mail size={12} /> {c.email}</div>
                  {c.phone && <div className="flex items-center gap-1.5"><Phone size={12} /> {c.phone}</div>}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 text-charcoal/70"><Package size={13} /> {c.orderCount}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 text-charcoal/70"><Heart size={13} /> {c.wishlistCount}</span>
                </td>
                <td className="px-5 py-3 hidden sm:table-cell text-charcoal/50 text-xs">
                  {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
