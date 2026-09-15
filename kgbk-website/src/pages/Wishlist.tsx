import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import ProductCard from "../components/product/ProductCard";

export default function Wishlist() {
  const { customer, wishlist, openAuth } = useCustomerAuth();

  useEffect(() => {
    document.title = "Wishlist | Krishna Gari Battala Kottu";
  }, []);

  if (!customer) {
    return (
      <div className="max-w-md mx-auto px-5 py-24 md:py-32 text-center">
        <Heart size={36} className="mx-auto mb-5 text-wine/40" />
        <p className="font-display text-2xl mb-3">Log in to see your wishlist</p>
        <p className="text-charcoal/60 mb-8">Save pieces you love and pick up where you left off.</p>
        <button onClick={openAuth} className="rounded-full bg-wine text-ivory px-7 py-3.5 text-sm font-medium hover:bg-wine-dark transition-colors">
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <p className="eyebrow text-gold mb-3">Saved</p>
      <h1 className="font-display text-3xl md:text-4xl mb-8">Your Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={32} className="mx-auto mb-4 text-charcoal/20" />
          <p className="text-charcoal/55 mb-6">Nothing saved yet.</p>
          <Link to="/collection" className="rounded-full border border-wine text-wine px-6 py-3 text-sm hover:bg-wine hover:text-ivory transition-colors">
            Browse Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {wishlist.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
