import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Heart, User, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import SearchOverlay from "./SearchOverlay";
import AccountMenu from "./AccountMenu";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Fabrics", to: "/collection/fabrics" },
  { label: "Sarees", to: "/collection/sarees" },
  { label: "Collections", to: "/collection" },
  { label: "Wedding", to: "/collection/wedding-collection" },
  { label: "Designer Wear", to: "/collection/designer-wear" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { count, open: openCart } = useCart();
  const { customer, wishlist, openAuth } = useCustomerAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/collection?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`sticky top-0 z-40 w-full transition-all duration-500 ${
          scrolled
            ? "bg-ivory/95 backdrop-blur-md border-b border-charcoal/10 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.08)]"
            : "bg-ivory border-b border-charcoal/8"
        }`}
      >
        {/* Utility row: logo, search, icons */}
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center gap-4 md:gap-8 py-5">
          <Link to="/" className="flex items-center gap-2.5 leading-none group shrink-0">
            <img
              src="/logo.png"
              alt="Krishna Gari Battala Kottu"
              className="h-8 md:h-9 w-auto shrink-0 transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <span className="hidden sm:inline-block font-display text-lg md:text-xl tracking-wide text-brand-gradient whitespace-nowrap">
              Krishna Gari Battala Kottu
            </span>
          </Link>

          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl">
            <div
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2.5 bg-beige/30 border border-charcoal/10 rounded-full px-4 py-2.5 cursor-text hover:border-gold/60 transition-colors"
            >
              <Search size={16} className="text-charcoal/40 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search for fabrics, sarees and more..."
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-charcoal/40"
              />
            </div>
          </form>

          <div className="flex items-center gap-5 ml-auto md:ml-0">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="flex md:hidden text-charcoal/75 hover:text-wine transition-colors duration-300 hover:scale-110"
            >
              <Search size={19} />
            </button>
            <Link
              to="/wishlist"
              className="relative hidden sm:flex text-charcoal/75 hover:text-wine transition-transform duration-300 hover:scale-110"
              aria-label="Wishlist"
            >
              <Heart size={19} />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-wine text-ivory text-[9px] flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            {customer ? (
              <AccountMenu />
            ) : (
              <button
                onClick={openAuth}
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-wine text-ivory px-5 py-2 text-[13px] font-medium hover:bg-wine-dark transition-colors"
                aria-label="Log in"
              >
                <User size={15} />
                Login
              </button>
            )}
            <button
              aria-label="Open cart"
              onClick={openCart}
              className="relative flex text-charcoal/75 hover:text-wine transition-transform duration-300 hover:scale-110"
            >
              <ShoppingBag size={19} />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-wine text-ivory text-[9px] flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
            <button
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden text-charcoal hover:text-wine transition-colors"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* Category row */}
        <nav className="hidden lg:flex items-center justify-center gap-8 border-t border-charcoal/8 py-3">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `text-[13px] tracking-wide font-medium transition-colors duration-300 relative py-1 ${
                  isActive ? "text-wine" : "text-charcoal/75 hover:text-wine"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span className={`absolute left-0 -bottom-0.5 h-px bg-gold transition-all duration-300 ${isActive ? "w-full" : "w-0"}`} />
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </motion.header>

      <AnimatePresence>
        {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-ivory shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-charcoal/10">
                <span className="font-display text-xl text-wine">Menu</span>
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-charcoal hover:text-wine">
                  <X size={22} />
                </button>
              </div>
              <nav className="flex flex-col px-6 py-6 gap-1 overflow-y-auto">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
                  >
                    <NavLink
                      to={link.to}
                      end={link.to === "/"}
                      onClick={() => setMenuOpen(false)}
                      className="block py-3 text-lg font-display text-charcoal hover:text-wine border-b border-charcoal/5"
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>
              <div className="mt-auto p-6 border-t border-charcoal/8 flex items-center justify-around">
                <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="relative flex flex-col items-center gap-1 text-charcoal/70 text-xs">
                  <Heart size={20} />
                  Wishlist
                  {wishlist.length > 0 && <span className="absolute -top-1 right-1.5 w-4 h-4 rounded-full bg-wine text-ivory text-[9px] flex items-center justify-center">{wishlist.length}</span>}
                </Link>
                {customer ? (
                  <button onClick={() => { setMenuOpen(false); }} className="flex flex-col items-center gap-1 text-charcoal/70 text-xs">
                    <User size={20} />
                    {customer.name.split(" ")[0]}
                  </button>
                ) : (
                  <button onClick={() => { setMenuOpen(false); openAuth(); }} className="flex flex-col items-center gap-1 text-charcoal/70 text-xs">
                    <User size={20} />
                    Log In
                  </button>
                )}
                <button onClick={() => { setMenuOpen(false); openCart(); }} className="relative flex flex-col items-center gap-1 text-charcoal/70 text-xs">
                  <ShoppingBag size={20} />
                  Cart
                  {count > 0 && <span className="absolute -top-1 right-1.5 w-4 h-4 rounded-full bg-wine text-ivory text-[9px] flex items-center justify-center">{count}</span>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
