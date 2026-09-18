import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Minus, Plus, ShoppingBag, Heart } from "lucide-react";
import { useProduct, useProducts } from "../hooks/useProducts";
import { useCareGuides, usePolicies } from "../hooks/useContent";
import { useCart } from "../context/CartContext";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
import ProductGallery from "../components/product/ProductGallery";
import ProductTabs, { type ProductTab } from "../components/product/ProductTabs";
import ShareButton from "../components/ui/ShareButton";
import ProductCard from "../components/product/ProductCard";
import { BUSINESS_CONFIG } from "../config/business";
import { slugify } from "../utils/slugify";

export default function ProductDetail() {
  const { productSlug } = useParams();
  const { product, loading } = useProduct(productSlug);
  const { products } = useProducts();
  const { careGuides } = useCareGuides();
  const { policies } = usePolicies();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useCustomerAuth();
  const [quantity, setQuantity] = useState(1);

  const tabs = useMemo<ProductTab[]>(() => {
    if (!product) return [];
    const matchedGuide = careGuides.find((g) => product.material.toLowerCase().includes(g.matchTerm.toLowerCase()));
    const shipping = policies.find((p) => p.slug === "shipping-policy");
    const returns = policies.find((p) => p.slug === "returns-exchange");

    const list: ProductTab[] = [
      { label: "More About The Product", content: [product.description, `Pattern: ${product.pattern}`, `Colour: ${product.color}`, `Best suited for: ${product.occasion}`] },
      {
        label: "Shipping And Returns",
        content: [
          ...(shipping?.sections.map((s) => s.body) ?? []),
          ...(returns?.sections.slice(0, 2).map((s) => s.body) ?? []),
        ],
      },
    ];
    if (matchedGuide) {
      list.push({ label: matchedGuide.title, content: matchedGuide.content.split("\n").filter(Boolean) });
    }
    list.push({
      label: "Customer Care",
      content: [
        `Have a question about this piece? Message us on WhatsApp at ${BUSINESS_CONFIG.phone} and we'll help right away.`,
        `Or write to us at ${BUSINESS_CONFIG.email}.`,
        `Visit our store: ${BUSINESS_CONFIG.address.line1}, ${BUSINESS_CONFIG.address.line2}, ${BUSINESS_CONFIG.address.city}.`,
      ],
    });
    return list;
  }, [product, careGuides, policies]);

  useDocumentMeta(
    product ? `${product.name} | Krishna Gari Battala Kottu` : "Krishna Gari Battala Kottu",
    product ? `${product.shortDescription} ${product.material} ${product.category} available at Krishna Gari Battala Kottu, Hyderabad.` : undefined
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-16 grid md:grid-cols-2 gap-12">
        <div className="aspect-[4/5] bg-beige rounded-sm animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 bg-beige rounded animate-pulse" />
          <div className="h-4 w-1/3 bg-beige rounded animate-pulse" />
          <div className="h-24 w-full bg-beige rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-32 text-center">
        <p className="font-display text-3xl mb-4">This piece could not be found</p>
        <Link to="/collection" className="text-wine underline">Browse the collection</Link>
      </div>
    );
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-16">
      <div className="flex items-center gap-1.5 text-xs text-charcoal/45 mb-8">
        <Link to="/" className="hover:text-wine">Home</Link>
        <ChevronRight size={12} />
        <Link to={`/collection/${slugify(product.category)}`} className="hover:text-wine">{product.category}</Link>
        <ChevronRight size={12} />
        <span className="text-charcoal/70">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10 md:gap-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-w-0">
          <ProductGallery images={product.images} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }} className="min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="eyebrow text-gold">{product.category} &middot; {product.subcategory}</p>
            <ShareButton title={product.name} />
          </div>
          <h1 className="font-display text-3xl md:text-4xl leading-tight mb-3">{product.name}</h1>
          <p className="text-2xl text-wine font-medium mb-3">
            &#8377;{product.price.toLocaleString("en-IN")} <span className="text-base text-charcoal/45 font-normal">{product.priceUnit}</span>
          </p>
          <p className={`text-xs inline-block px-2.5 py-1 rounded-full ${product.availability === "Available" ? "bg-green-800/10 text-green-800" : "bg-charcoal/10 text-charcoal/60"}`}>
            {product.availability}
          </p>

          <p className="text-charcoal/65 leading-relaxed mt-6 mb-8">{product.shortDescription}</p>

          <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
            <div><p className="text-charcoal/40 text-xs mb-1">Material</p><p>{product.material}</p></div>
            <div><p className="text-charcoal/40 text-xs mb-1">Colour</p><p>{product.color}</p></div>
            <div><p className="text-charcoal/40 text-xs mb-1">Pattern</p><p>{product.pattern}</p></div>
            <div><p className="text-charcoal/40 text-xs mb-1">Occasion</p><p>{product.occasion}</p></div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center border border-charcoal/15 rounded-full">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-3 hover:text-wine" aria-label="Decrease quantity">
                  <Minus size={14} />
                </button>
                <span className="text-sm w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="p-3 hover:text-wine" aria-label="Increase quantity">
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => addItem(product, quantity)}
                disabled={product.availability === "Sold Out"}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-wine text-ivory px-8 py-4 text-sm font-medium hover:bg-wine-dark transition-colors disabled:opacity-50"
              >
                <ShoppingBag size={16} /> {product.availability === "Sold Out" ? "Sold Out" : "Add to Cart"}
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                aria-label={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                className="w-[52px] h-[52px] rounded-full border border-charcoal/15 flex items-center justify-center hover:border-wine transition-colors shrink-0"
              >
                <Heart size={17} className={isWishlisted(product.id) ? "text-wine" : "text-charcoal/60"} fill={isWishlisted(product.id) ? "currentColor" : "none"} />
              </button>
            </div>
          </motion.div>

          <ProductTabs tabs={tabs} />
        </motion.div>
      </div>

      {related.length > 0 && (
        <div className="mt-16 md:mt-20">
          <p className="eyebrow text-gold mb-3">You may also like</p>
          <h2 className="font-display text-3xl mb-10">Similar Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
