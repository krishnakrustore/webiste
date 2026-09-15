import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, ShoppingBag, Heart } from "lucide-react";
import type { Product } from "../../types/product";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { productUrl } from "../../utils/productUrl";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const cover = product.images[0];
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useCustomerAuth();
  const soldOut = product.availability === "Sold Out";
  const wishlisted = isWishlisted(product.id);
  const href = productUrl(product);
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.06 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-sm bg-beige aspect-[4/5]">
        <Link to={href} className="absolute inset-0 block">
          {cover && (
            <img
              src={cover.src}
              alt={cover.alt}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {product.availability !== "Available" && (
            <span className="absolute top-3 left-3 bg-charcoal/80 text-ivory text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full">
              {product.availability}
            </span>
          )}
        </Link>
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-ivory/90 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110"
        >
          <Heart size={14} className={wishlisted ? "text-wine" : "text-charcoal/60"} fill={wishlisted ? "currentColor" : "none"} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 z-10">
          <button
            onClick={() => addItem(product)}
            disabled={soldOut}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-wine text-ivory text-[12px] py-2.5 font-medium hover:bg-wine-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag size={14} /> {soldOut ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
      <Link to={href} className="block mt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[15px] font-medium text-charcoal group-hover:text-wine transition-colors duration-300">
              {product.name}
            </p>
            <p className="text-xs text-charcoal/50 mt-1">{product.material}</p>
          </div>
          <ArrowUpRight size={15} className="mt-1 text-gold shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <p className="text-sm text-wine mt-2 font-medium">
          &#8377;{product.price.toLocaleString("en-IN")} <span className="text-charcoal/40 font-normal">{product.priceUnit}</span>
        </p>
      </Link>
    </motion.div>
  );
}
