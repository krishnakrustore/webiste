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
  instagram: string;
  facebook: string;
  hours: { days: string; time: string }[];
}

export const BUSINESS_CONFIG: BusinessConfig = {
  name: "Krishna Gari Battala Kottu",
  legalName: "Krishna Gari Battala Kottu",
  tagline: "Fine Fabrics & Sarees",
  // TODO: replace with the client's real WhatsApp number (country code + number, digits only)
  whatsapp: "919999999999",
  phone: "+91 99999 99999",
  email: "hello@krishnagaribattalakottu.in",
  address: {
    line1: "Plot 490/1, Road No. 10",
    line2: "Jubilee Hills",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    country: "India",
    landmark: "Near Peddamma Temple",
  },
  mapsUrl: "https://maps.app.goo.gl/ee5cBikLtATmgJgKA",
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

export function buildProductEnquiryMessage(params: { name: string; id: string }): string {
  return [
    `Hello ${BUSINESS_CONFIG.name},`,
    ``,
    `I am interested in:`,
    `Product: ${params.name}`,
    `Product ID: ${params.id}`,
    ``,
    `Please share availability, pricing and more details.`,
    `Thank you.`,
  ].join("\n");
}

export function buildGeneralEnquiryMessage(): string {
  return `Hello ${BUSINESS_CONFIG.name}, I would like to know more about your collection. Could you please assist me?`;
}
