export interface PolicyContent {
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}

// Generic, editable starting-point policy text -- have this reviewed by
// someone qualified before relying on it as your actual legal terms.
export const POLICIES: Record<string, PolicyContent> = {
  "privacy-policy": {
    title: "Privacy Policy",
    updated: "Last updated: 2026",
    sections: [
      { heading: "Information We Collect", body: "When you place an order or contact us, we collect your name, email, phone number, and shipping address. We do not store payment card details -- these are handled directly by our payment processor, Razorpay." },
      { heading: "How We Use It", body: "We use your information to process orders, arrange delivery, and respond to enquiries. We never sell your personal information to third parties." },
      { heading: "Third Parties", body: "We share order details with our payment gateway (Razorpay) and shipping partner (Shiprocket) only as needed to process and deliver your order." },
      { heading: "Contact", body: "For questions about this policy or to request your data be deleted, reach out via the contact details in our footer." },
    ],
  },
  "shipping-policy": {
    title: "Shipping Policy",
    updated: "Last updated: 2026",
    sections: [
      { heading: "Delivery Areas", body: "We currently ship across India. Delivery timelines vary by location, typically 4-9 business days from dispatch." },
      { heading: "Shipping Charges", body: "Orders above ₹2,999 ship free. Orders below this qualify for a flat shipping fee, shown at checkout before you pay." },
      { heading: "Processing Time", body: "Orders are packed and handed to our courier partner within 1-2 business days of payment confirmation." },
      { heading: "Tracking", body: "Once dispatched, you'll receive tracking details. You can also check your order status any time on our Track Your Order page." },
    ],
  },
  "returns-exchange": {
    title: "Return & Exchange Policy",
    updated: "Last updated: 2026",
    sections: [
      { heading: "Eligibility", body: "Unused items in original packaging, with tags intact, can be returned or exchanged within 7 days of delivery. Custom or made-to-order pieces are not eligible." },
      { heading: "How to Request", body: "Message us on WhatsApp or email with your order number and reason for return -- our team will guide you through the process." },
      { heading: "Refunds", body: "Approved refunds are processed to the original payment method within 5-7 business days of us receiving the returned item." },
      { heading: "Damaged or Incorrect Items", body: "If you receive a damaged or incorrect item, contact us within 48 hours of delivery with photos, and we'll arrange a replacement at no extra cost." },
    ],
  },
  "terms-of-service": {
    title: "Terms of Service",
    updated: "Last updated: 2026",
    sections: [
      { heading: "Orders", body: "By placing an order, you confirm the shipping and contact details you provide are accurate. We reserve the right to cancel orders we suspect are fraudulent." },
      { heading: "Pricing", body: "Prices are listed in INR and may change without notice. The price at the time of your order is the price you pay." },
      { heading: "Product Accuracy", body: "We take care to photograph and describe products accurately. Because our pieces are handwoven, minor variations in colour and weave are natural and not considered defects." },
      { heading: "Governing Law", body: "These terms are governed by the laws of India, with courts in Hyderabad, Telangana having jurisdiction over any disputes." },
    ],
  },
};
