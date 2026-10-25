export type Availability = "Available" | "Made to Order" | "Sold Out";
export type ProductStatus = "draft" | "published";

export const IMAGE_LABELS = ["Catalogue", "Blouse", "Pallu", "Detail"] as const;
export type ImageLabel = (typeof IMAGE_LABELS)[number] | "";

export interface ProductImage {
  id: string;
  /** Hosted URL, or a base64 data URL for a fresh upload not yet saved */
  src: string;
  alt: string;
  label?: ImageLabel;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category: string;
  subcategory: string;
  description: string;
  shortDescription: string;
  material: string;
  color: string;
  pattern: string;
  occasion: string;
  availability: Availability;
  featured: boolean;
  status: ProductStatus;
  seoTitle?: string;
  seoDescription?: string;
  images: ProductImage[];
  createdAt: string;
}

export type ProductInput = Omit<Product, "id" | "slug" | "createdAt">;

export interface CategoryDef {
  name: string;
  slug: string;
  description: string;
  image: string;
}

export interface FabricTypeDef {
  name: string;
  slug: string;
}

export interface SiteSettings {
  businessName: string;
  phone: string;
  whatsapp: string;
  addressLine: string;
  mapsUrl: string;
  instagram: string;
  facebook: string;
  googleRating: number;
  googleReviewCount: number;
  googleReviewUrl: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  message: string;
  rating: number;
  avatar: string | null;
  source: string;
  featured: boolean;
  position: number;
  createdAt: string;
}

export type TestimonialInput = Omit<Testimonial, "id" | "createdAt">;

export interface Banner {
  id: string;
  image: string;
  link: string | null;
  alt: string;
  position: number;
  active: boolean;
  createdAt: string;
}

export type BannerInput = Omit<Banner, "id" | "createdAt">;
