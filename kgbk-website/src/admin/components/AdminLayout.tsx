import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Tags, Image, MessageSquareQuote, ShoppingCart, Users, PhoneCall, Shirt, Settings, LogOut, ExternalLink } from "lucide-react";
import { useAdminAuth } from "../hooks/useAdminAuth";

const NAV = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Orders", to: "/admin/orders", icon: ShoppingCart, end: false },
  { label: "Customers", to: "/admin/customers", icon: Users, end: false },
  { label: "Products", to: "/admin/products", icon: Package, end: false },
  { label: "Catalogue", to: "/admin/catalogue", icon: Tags, end: false },
  { label: "Care Guides", to: "/admin/care-guides", icon: Shirt, end: false },
  { label: "Banners", to: "/admin/banners", icon: Image, end: false },
  { label: "Testimonials", to: "/admin/testimonials", icon: MessageSquareQuote, end: false },
  { label: "Schedule Calls", to: "/admin/schedule-calls", icon: PhoneCall, end: false },
  { label: "Settings", to: "/admin/settings", icon: Settings, end: false },
];

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F5F3] flex text-charcoal font-sans">
      <aside className="w-60 shrink-0 bg-charcoal text-ivory flex flex-col">
        <div className="px-6 py-6 border-b border-ivory/10">
          <Link to="/admin" className="font-display text-xl">Krishna Gari</Link>
          <p className="text-[10px] tracking-widest uppercase text-ivory/40 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200 ${
                  isActive ? "bg-ivory/10 text-ivory" : "text-ivory/55 hover:text-ivory hover:bg-ivory/5"
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-ivory/10 space-y-1">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ivory/55 hover:text-ivory hover:bg-ivory/5 transition-colors">
            <ExternalLink size={16} /> View Site
          </a>
          <button
            onClick={() => { logout(); navigate("/admin/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ivory/55 hover:text-ivory hover:bg-ivory/5 transition-colors"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
