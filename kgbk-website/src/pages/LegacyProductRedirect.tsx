import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useProduct } from "../hooks/useProducts";
import { productUrl } from "../utils/productUrl";

// Old /product/:slug links (shared before the URL scheme changed) land here
// and forward to the new /collection/:category/:slug path once the
// product's category is known.
export default function LegacyProductRedirect() {
  const { productSlug } = useParams();
  const { product, loading } = useProduct(productSlug);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (product) return <Navigate to={productUrl(product)} replace />;
  if (!loading && timedOut) return <Navigate to="/collection" replace />;
  return null;
}
