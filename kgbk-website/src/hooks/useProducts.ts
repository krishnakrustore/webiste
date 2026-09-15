import { useEffect, useState, useCallback } from "react";
import { ProductRepository, subscribeToCatalogueChanges } from "../storage/ProductRepository";
import type { Product } from "../types/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const items = await ProductRepository.getProducts();
    setProducts(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const unsubscribe = subscribeToCatalogueChanges(() => reload());
    return unsubscribe;
  }, [reload]);

  return { products, loading, reload };
}

export function useProduct(slug: string | undefined) {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    ProductRepository.getProductBySlug(slug).then((p) => {
      if (active) {
        setProduct(p);
        setLoading(false);
      }
    });
    const unsubscribe = subscribeToCatalogueChanges(() => {
      ProductRepository.getProductBySlug(slug).then((p) => active && setProduct(p));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [slug]);

  return { product, loading };
}
