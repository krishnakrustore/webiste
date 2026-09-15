export type Availability = "Available" | "Made to Order" | "Sold Out";

export interface ProductImage {
  id: string;
  /** base64 data URL when uploaded via admin, or an external URL for seed data */
  src: string;
  alt: string;
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
  price: number;
  priceUnit: string;
  material: string;
  color: string;
  pattern: string;
  occasion: string;
  availability: Availability;
  featured: boolean;
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

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  shiprocketOrderId: string | null;
  items: OrderItem[];
  createdAt: string;
}

export interface CheckoutAddress {
  customerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}
