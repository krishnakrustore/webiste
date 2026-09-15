import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { User, Heart, Package, LogOut } from "lucide-react";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

export default function AccountMenu() {
  const { customer, logout } = useCustomerAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!customer) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden sm:flex text-charcoal/75 hover:text-wine transition-transform duration-300 hover:scale-110"
        aria-label="Account menu"
      >
        <User size={19} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-3 w-56 bg-ivory rounded-xl shadow-xl border border-charcoal/8 overflow-hidden z-20"
          >
            <div className="px-4 py-3 border-b border-charcoal/8">
              <p className="text-sm font-medium truncate">{customer.name}</p>
              <p className="text-xs text-charcoal/45 truncate">{customer.email}</p>
            </div>
            <Link to="/wishlist" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal/75 hover:bg-beige/40 hover:text-wine transition-colors">
              <Heart size={14} /> Wishlist
            </Link>
            <Link to="/track-order" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal/75 hover:bg-beige/40 hover:text-wine transition-colors">
              <Package size={14} /> My Orders
            </Link>
            <button onClick={() => { logout(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal/75 hover:bg-beige/40 hover:text-wine transition-colors border-t border-charcoal/8">
              <LogOut size={14} /> Log Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
