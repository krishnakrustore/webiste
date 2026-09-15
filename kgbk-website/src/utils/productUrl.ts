import { slugify } from "./slugify";

/**
 * SEO-friendly product URL: /collection/<category-slug>/<product-slug>
 * instead of a generic /product/<slug> -- mirrors how the collection
 * browsing routes are already structured and avoids a meaningless
 * "product" segment in the path.
 */
export function productUrl(product: { category: string; slug: string }): string {
  return `/collection/${slugify(product.category)}/${product.slug}`;
}
