import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { productUrl } from "../../utils/productUrl";

export default function CartDrawer() {
  const { items, subtotal, isOpen, close, updateQuantity, removeItem } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-charcoal/45 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-[90%] max-w-md bg-ivory shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-charcoal/10">
              <span className="font-display text-xl text-wine flex items-center gap-2">
                <ShoppingBag size={18} /> Your Cart
              </span>
              <button onClick={close} aria-label="Close cart" className="text-charcoal hover:text-wine">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-charcoal/45">
                  <ShoppingBag size={36} className="mb-4 opacity-40" />
                  <p className="text-sm">Your cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <Link to={productUrl(item)} onClick={close} className="w-16 h-20 rounded-md overflow-hidden bg-beige shrink-0">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={productUrl(item)} onClick={close} className="text-sm font-medium text-charcoal hover:text-wine transition-colors line-clamp-2">
                          {item.name}
                        </Link>
                        <p className="text-sm text-wine font-medium mt-1">&#8377;{item.price.toLocaleString("en-IN")}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-charcoal/15 rounded-full">
                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1.5 hover:text-wine" aria-label="Decrease quantity">
                              <Minus size={13} />
                            </button>
                            <span className="text-xs w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1.5 hover:text-wine" aria-label="Increase quantity">
                              <Plus size={13} />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.productId)} className="text-charcoal/40 hover:text-red-600 transition-colors" aria-label="Remove item">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-charcoal/10">
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-charcoal/60">Subtotal</span>
                  <span className="font-medium text-lg">&#8377;{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-[11px] text-charcoal/45 mb-4">Shipping &amp; taxes calculated at checkout.</p>
                <Link
                  to="/checkout"
                  onClick={close}
                  className="block w-full text-center rounded-full bg-wine text-ivory py-3.5 text-sm font-medium hover:bg-wine-dark transition-colors"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
