// Central business configuration.
// Update WhatsApp / phone numbers here -- this is the single source of truth.
export interface BusinessConfig {
  name: string;
  legalName: string;
  tagline: string;
  whatsapp: string; // digits only, with country code, no + or spaces
  phone: string;
  email: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    landmark: string;
  };
  mapsUrl: string;
  mapEmbedUrl: string;
  instagram: string;
  facebook: string;
  hours: { days: string; time: string }[];
}

export const BUSINESS_CONFIG: BusinessConfig = {
  name: "Krishna Gari Battala Kottu",
  legalName: "Krishna Gari Battala Kottu",
  tagline: "Fine Fabrics & Sarees",
  // Every WhatsApp button and enquiry on the site goes to this number (country code + number, digits only).
  whatsapp: "917661935846",
  phone: "+91 76619 35846",
  email: "hello@krishnagaribattalakottu.in",
  address: {
    line1: "8-2-293/82/a/490, 1, Road Number 10",
    line2: "Jubilee Hills",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    country: "India",
    landmark: "Near Peddamma Temple",
  },
  mapsUrl: "https://share.google/oV74u6NwkbZNIdxJL",
  mapEmbedUrl:
    "https://www.google.com/maps?q=" +
    encodeURIComponent("Krishna Gari Battala Kottu, 8-2-293/82/a/490, Road Number 10, Jubilee Hills, Hyderabad, Telangana 500033") +
    "&output=embed",
  instagram: "",
  facebook: "",
  hours: [
    { days: "Monday - Saturday", time: "10:30 AM - 8:30 PM" },
    { days: "Sunday", time: "11:00 AM - 7:00 PM" },
  ],
};

/** Builds a wa.me deep link with a pre-filled, URL-encoded enquiry message. */
export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${BUSINESS_CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function buildProductEnquiryMessage(params: { name: string; url: string; sku?: string | null }): string {
  return [
    `Hello ${BUSINESS_CONFIG.name},`,
    ``,
    `I am interested in: ${params.name}`,
    ...(params.sku ? [`Product code: ${params.sku}`] : []),
    params.url,
    ``,
    `Please share the price, availability and more details.`,
    `Thank you.`,
  ].join("\n");
}

export function buildGeneralEnquiryMessage(): string {
  return `Hello ${BUSINESS_CONFIG.name}, I would like to know more about your collection. Could you please assist me?`;
}
