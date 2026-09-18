import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./db.js";
import { slugify } from "./utils/slugify.js";

const pexels = (id: number, alt: string, w = 1200) => ({
  src: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`,
  alt,
});

const CATEGORIES = [
  { name: "Fabrics", description: "Handpicked yardage in silk, cotton and blends", image: pexels(4863035, "").src },
  { name: "Sarees", description: "Timeless drapes for every occasion", image: pexels(28943586, "").src },
  { name: "Designer Sarees", description: "Contemporary craft, modern silhouettes", image: pexels(33078836, "").src },
  { name: "Silk Collection", description: "Pure silk, woven with heritage technique", image: pexels(7232843, "").src },
  { name: "Banarasi", description: "Zari brocade from the ghats of Varanasi", image: pexels(7676881, "").src },
  { name: "Wedding Collection", description: "Bridal edits for the biggest day", image: pexels(30171215, "").src },
  { name: "Party Wear", description: "Statement pieces for evenings out", image: pexels(15305990, "").src },
  { name: "Designer Wear", description: "Tailored, contemporary Indian fashion", image: pexels(6843237, "").src },
];

const OCCASIONS = [
  { name: "Wedding", description: "Rich weaves for the main event", image: pexels(19869152, "").src },
  { name: "Engagement", description: "Soft luxury for the promise", image: pexels(33078836, "").src },
  { name: "Reception", description: "Bold drapes that command a room", image: pexels(28933406, "").src },
  { name: "Festive", description: "Colour and craft for the season", image: pexels(7676881, "").src },
  { name: "Party", description: "Contemporary edits for evenings", image: pexels(15305990, "").src },
  { name: "Traditional", description: "Classic weaves, timeless technique", image: pexels(28943572, "").src },
  { name: "Contemporary", description: "Modern cuts, heritage fabric", image: pexels(6843237, "").src },
  { name: "Mehendi", description: "Vibrant drapes for pre-wedding rituals", image: pexels(8106525, "").src },
];

const FABRIC_TYPES = [
  "Silk", "Raw Silk", "Pure Silk", "Banarasi", "Tissue", "Tissue Raw Silk",
  "Organza", "Georgette", "Cotton", "Khadi Cotton", "Kolkata Jamdani",
  "Brocade", "Ikat", "Printed", "Cotton Printed", "Chanderi Printed",
  "Ajrakh Print (Modal Satin)", "Linen Print", "Linen Woven", "Embroidered",
  "Fancy Work", "Chikankari", "Export Material", "Narayanpet Cotton",
  "Mangalgiri Cotton", "Malkha Khadi", "Dyeable Fabric (All Types)",
  "Stitching", "Dyeing",
];

const CARE_GUIDES = [
  {
    title: "Silk Care",
    matchTerm: "silk",
    content: [
      "Dry clean only -- do not machine wash.",
      "Store folded in a breathable muslin cloth, away from direct sunlight.",
      "Refold along different lines every few months to prevent permanent creases.",
      "Iron on the reverse side, on low heat, with a thin cloth between iron and fabric.",
      "Keep away from perfume and deodorant, which can stain silk permanently.",
    ].join("\n"),
  },
  {
    title: "Cotton Care",
    matchTerm: "cotton",
    content: [
      "Hand wash separately in cold water for the first few washes to prevent colour bleed.",
      "Avoid harsh detergents and bleach.",
      "Dry in shade, not direct sunlight, to preserve colour.",
      "Iron while slightly damp for a crisp finish.",
    ].join("\n"),
  },
  {
    title: "Georgette & Organza Care",
    matchTerm: "georgette",
    content: [
      "Dry clean recommended for embellished pieces.",
      "Hand wash plain georgette gently in cold water if needed.",
      "Do not wring -- roll in a towel to remove excess water, then hang dry.",
      "Store flat or on a padded hanger to maintain drape.",
    ].join("\n"),
  },
];

const POLICIES = [
  {
    slug: "payment-policy",
    title: "Payment Policy",
    image: pexels(6802049, "").src,
    sections: [
      { heading: "Accepted Payment Methods", body: "We accept UPI, credit/debit cards and net banking via Razorpay's secure checkout, as well as Cash on Delivery on eligible orders." },
      { heading: "Payment Security", body: "We never store your card details on our servers -- all payments are processed directly by Razorpay, a PCI-DSS compliant payment gateway." },
      { heading: "Order Confirmation", body: "Your order is confirmed once payment is successfully verified. You'll receive a confirmation on WhatsApp and email with your order details." },
      { heading: "Failed or Pending Payments", body: "If a payment fails or stays pending, the amount (if deducted) is automatically refunded by your bank or Razorpay within 5-7 business days. Contact us if you don't see it reversed." },
    ],
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    image: pexels(6801648, "").src,
    sections: [
      { heading: "Information We Collect", body: "When you place an order or contact us, we collect your name, email, phone number, and shipping address. We do not store payment card details -- these are handled directly by our payment processor, Razorpay." },
      { heading: "How We Use It", body: "We use your information to process orders, arrange delivery, and respond to enquiries. We never sell your personal information to third parties." },
      { heading: "Third Parties", body: "We share order details with our payment gateway (Razorpay) and shipping partner (Shiprocket) only as needed to process and deliver your order." },
      { heading: "Contact", body: "For questions about this policy or to request your data be deleted, reach out via the contact details in our footer." },
    ],
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    image: pexels(4483610, "").src,
    sections: [
      { heading: "Delivery Areas", body: "We currently ship across India. Delivery timelines vary by location, typically 4-9 business days from dispatch." },
      { heading: "Shipping Charges", body: "Orders above ₹2,999 ship free. Orders below this qualify for a flat shipping fee, shown at checkout before you pay." },
      { heading: "Processing Time", body: "Orders are packed and handed to our courier partner within 1-2 business days of payment confirmation." },
      { heading: "Tracking", body: "Once dispatched, you'll receive tracking details. You can also check your order status any time on our Track Your Order page." },
    ],
  },
  {
    slug: "returns-exchange",
    title: "Return & Exchange Policy",
    image: pexels(5632402, "").src,
    sections: [
      { heading: "Eligibility", body: "Unused items in original packaging, with tags intact, can be returned or exchanged within 7 days of delivery. Custom or made-to-order pieces are not eligible." },
      { heading: "How to Request", body: "Message us on WhatsApp or email with your order number and reason for return -- our team will guide you through the process." },
      { heading: "Refunds", body: "Approved refunds are processed to the original payment method within 5-7 business days of us receiving the returned item." },
      { heading: "Damaged or Incorrect Items", body: "If you receive a damaged or incorrect item, contact us within 48 hours of delivery with photos, and we'll arrange a replacement at no extra cost." },
    ],
  },
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    image: pexels(4386321, "").src,
    sections: [
      { heading: "Orders", body: "By placing an order, you confirm the shipping and contact details you provide are accurate. We reserve the right to cancel orders we suspect are fraudulent." },
      { heading: "Pricing", body: "Prices are listed in INR and may change without notice. The price at the time of your order is the price you pay." },
      { heading: "Product Accuracy", body: "We take care to photograph and describe products accurately. Because our pieces are handwoven, minor variations in colour and weave are natural and not considered defects." },
      { heading: "Governing Law", body: "These terms are governed by the laws of India, with courts in Hyderabad, Telangana having jurisdiction over any disputes." },
    ],
  },
  {
    slug: "cancellation-policy",
    title: "Cancellation Policy",
    image: pexels(5025639, "").src,
    sections: [
      { heading: "Before Dispatch", body: "Orders can be cancelled free of charge any time before they're handed to our courier partner -- message us on WhatsApp with your order number." },
      { heading: "After Dispatch", body: "Once an order has shipped, it can no longer be cancelled -- you're welcome to refuse delivery or use our Return & Exchange Policy instead." },
      { heading: "Custom Orders", body: "Made-to-order or customised pieces cannot be cancelled once production has started, since fabric and work are committed specifically for that order." },
      { heading: "Refund Timeline", body: "Approved cancellations are refunded to the original payment method within 5-7 business days." },
    ],
  },
];

// Removed from the live catalogue but kept here as a record: re-adding
// either of these later just means putting the object back above.
const RETIRED_POLICY_SLUGS = ["exchange-policy", "faq"];

const TESTIMONIALS = [
  { name: "Priya Reddy", location: "Hyderabad", message: "Beautiful collection and the team helped me pick the perfect Kanchipuram silk for my sister's wedding. Highly recommend!", rating: 5, source: "Google", avatar: pexels(774909, "Priya Reddy", 200).src },
  { name: "Ananya Rao", location: "Hyderabad", message: "Their Banarasi sarees are gorgeous -- true zari work, not the machine-made stuff you find everywhere else.", rating: 5, source: "Google", avatar: pexels(415829, "Ananya Rao", 200).src },
  { name: "Sowmya K", location: "Secunderabad", message: "Personal attention, no pressure to buy, and they remembered my preferences from last visit. Lovely experience.", rating: 5, source: "Google", avatar: pexels(733872, "Sowmya K", 200).src },
];

const PRODUCTS = [
  { name: "Royal Banarasi Silk Fabric", category: "Fabrics", subcategory: "Banarasi", price: 2450, material: "Banarasi Silk", color: "Wine", pattern: "Traditional Woven", occasion: "Wedding", featured: true, images: [pexels(7676881, "Gold zari brocade silk fabric"), pexels(4863069, "Wine silk fabric close-up"), pexels(7056429, "Golden silk fabric texture")] },
  { name: "Kanchipuram Heritage Saree", category: "Sarees", subcategory: "Kanchipuram Silk", price: 18500, priceUnit: "per piece", material: "Kanchipuram Silk", color: "Deep Maroon", pattern: "Temple Border", occasion: "Wedding", featured: true, images: [pexels(4863069, "Deep maroon silk saree fabric"), pexels(15305990, "Gold temple border silk texture"), pexels(30171215, "Bride draped in a traditional silk saree")] },
  { name: "Champagne Organza Drape", category: "Sarees", subcategory: "Organza", price: 6200, priceUnit: "per piece", material: "Organza", color: "Champagne", pattern: "Sequin Work", occasion: "Party", featured: true, images: [pexels(14380626, "Champagne organza fabric close-up"), pexels(15305987, "Sequin gold fabric detail"), pexels(28943586, "Woman draped in an elegant saree")] },
  { name: "Ivory Tissue Silk Saree", category: "Designer Sarees", subcategory: "Tissue", price: 9800, priceUnit: "per piece", material: "Tissue Silk", color: "Ivory", pattern: "Zari Border", occasion: "Reception", featured: true, images: [pexels(14380623, "Ivory tissue silk fabric"), pexels(7232843, "Elegant gold zari border fabric"), pexels(33078836, "Young woman in a designer silk saree")] },
  { name: "Charcoal Georgette Fabric", category: "Fabrics", subcategory: "Georgette", price: 1650, material: "Georgette", color: "Charcoal", pattern: "Solid", occasion: "Contemporary", images: [pexels(6843237, "Charcoal grey georgette fabric"), pexels(4863035, "Fine textile weave close-up"), pexels(5908326, "Natural fabric texture detail")] },
  { name: "Wine Ikat Handloom Fabric", category: "Fabrics", subcategory: "Ikat", price: 2100, material: "Ikat Cotton", color: "Wine", pattern: "Ikat Weave", occasion: "Festive", images: [pexels(6276014, "Wine red handloom fabric"), pexels(6634454, "Handwoven ikat fabric texture"), pexels(4863069, "Wine silk fabric close-up")] },
  { name: "Gold Brocade Bridal Fabric", category: "Fabrics", subcategory: "Brocade", price: 3450, material: "Brocade", color: "Gold", pattern: "Floral Brocade", occasion: "Wedding", featured: true, images: [pexels(7676881, "Gold brocade fabric close-up"), pexels(7056429, "Smooth golden bridal fabric"), pexels(15305990, "Gold satin fabric detail")] },
  { name: "Beige Printed Cotton Saree", category: "Sarees", subcategory: "Printed Fabrics", price: 2800, priceUnit: "per piece", material: "Cotton", color: "Beige", pattern: "Block Print", occasion: "Traditional", images: [pexels(14380626, "Beige cotton fabric close-up"), pexels(4863035, "Printed cotton textile detail"), pexels(28943572, "Woman in a printed cotton saree")] },
  { name: "Emerald Embroidered Georgette Saree", category: "Designer Sarees", subcategory: "Embroidered", price: 12400, priceUnit: "per piece", material: "Georgette", color: "Emerald", pattern: "Thread Embroidery", occasion: "Party", images: [pexels(11871835, "Emerald green embroidered fabric"), pexels(29060166, "Green woven fabric close-up"), pexels(33078836, "Woman in a designer embroidered saree")] },
  { name: "Burgundy Kanchipuram Silk Saree", category: "Silk Collection", subcategory: "Kanchipuram Silk", price: 21500, priceUnit: "per piece", material: "Kanchipuram Silk", color: "Burgundy", pattern: "Temple Border", occasion: "Wedding", featured: true, images: [pexels(4863069, "Burgundy silk saree fabric"), pexels(15305987, "Gold temple border silk detail"), pexels(30171215, "Bride in a burgundy silk saree")] },
  { name: "Soft Beige Banarasi Saree", category: "Wedding Collection", subcategory: "Banarasi", price: 16800, priceUnit: "per piece", material: "Banarasi Silk", color: "Soft Beige", pattern: "Zari Motif", occasion: "Wedding", images: [pexels(14380623, "Soft beige Banarasi silk fabric"), pexels(7676881, "Gold zari motif fabric detail"), pexels(19869152, "Bride in traditional wedding attire")] },
  { name: "Champagne Sequin Party Saree", category: "Party Wear", subcategory: "Georgette", price: 7400, priceUnit: "per piece", material: "Georgette", color: "Champagne", pattern: "Sequin", occasion: "Party", images: [pexels(10816859, "Champagne sequin georgette fabric"), pexels(15305990, "Gold sequin fabric close-up"), pexels(28943586, "Woman in a sequinned party saree")] },
  { name: "Charcoal Tissue Designer Drape", category: "Designer Wear", subcategory: "Tissue", price: 11200, priceUnit: "per piece", material: "Tissue Silk", color: "Charcoal", pattern: "Ombre", occasion: "Contemporary", images: [pexels(6843237, "Charcoal ombre tissue fabric"), pexels(5908326, "Fine textile ombre texture"), pexels(4863035, "Designer fabric close-up detail")] },
  { name: "Wine Organza Fabric", category: "Fabrics", subcategory: "Organza", price: 1850, material: "Organza", color: "Wine", pattern: "Solid", occasion: "Festive", images: [pexels(4863069, "Wine organza fabric close-up"), pexels(6276014, "Wine red organza texture"), pexels(4863035, "Sheer fabric detail")] },
  { name: "Gold Ikat Silk Saree", category: "Silk Collection", subcategory: "Ikat", price: 14600, priceUnit: "per piece", material: "Ikat Silk", color: "Gold", pattern: "Ikat Weave", occasion: "Traditional", images: [pexels(7056429, "Gold ikat silk fabric"), pexels(7232843, "Golden ikat weave detail"), pexels(28943572, "Woman in a gold silk saree")] },
  { name: "Maroon Brocade Designer Blouse Fabric", category: "Fabrics", subcategory: "Brocade", price: 1450, priceUnit: "per set", material: "Brocade", color: "Maroon", pattern: "Floral", occasion: "Wedding", images: [pexels(6276014, "Maroon brocade fabric close-up"), pexels(7676881, "Gold floral brocade detail"), pexels(6634454, "Textured brocade weave")] },
  { name: "Ivory Embroidered Wedding Saree", category: "Wedding Collection", subcategory: "Embroidered", price: 24500, priceUnit: "per piece", material: "Silk Georgette", color: "Ivory", pattern: "Hand Embroidery", occasion: "Wedding", featured: true, images: [pexels(14380626, "Ivory hand-embroidered silk fabric"), pexels(15305987, "Gold embroidery fabric detail"), pexels(28933406, "Bride in an ivory embroidered wedding saree")] },
  { name: "Beige Cotton Handloom Fabric", category: "Fabrics", subcategory: "Cotton", price: 980, material: "Handloom Cotton", color: "Beige", pattern: "Stripe", occasion: "Contemporary", images: [pexels(6634454, "Beige handloom cotton fabric"), pexels(10816859, "Natural cotton texture close-up"), pexels(5908326, "Handwoven cotton detail")] },
];

async function seedSettings() {
  console.log("Seeding settings...");
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      businessName: "Krishna Gari Battala Kottu",
      phone: "+91 99999 99999",
      whatsapp: "919999999999",
      addressLine: "Plot 490/1, Road No. 10, Jubilee Hills, Hyderabad - 500033",
      mapsUrl: "https://maps.app.goo.gl/ee5cBikLtATmgJgKA",
      instagram: "",
      facebook: "",
      // Left at 0 deliberately -- set your real Google Business Profile
      // rating/count in Admin > Settings once you have genuine reviews.
      googleRating: 0,
      googleReviewCount: 0,
      googleReviewUrl: "",
    },
  });
}

async function main() {
  await seedSettings();

  console.log("Seeding admin user...");
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const existingAdmin = await prisma.adminUser.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.adminUser.create({ data: { username: adminUsername, passwordHash } });
    console.log(`  created admin user "${adminUsername}"`);
  } else {
    console.log(`  admin user "${adminUsername}" already exists, skipping`);
  }

  console.log("Seeding categories...");
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: {},
      create: { ...c, slug: slugify(c.name) },
    });
  }

  console.log("Seeding occasions...");
  for (const o of OCCASIONS) {
    await prisma.occasion.upsert({
      where: { slug: slugify(o.name) },
      update: {},
      create: { ...o, slug: slugify(o.name) },
    });
  }

  console.log("Seeding fabric types...");
  for (const name of FABRIC_TYPES) {
    await prisma.fabricType.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }

  console.log("Seeding care guides...");
  const existingCareGuides = await prisma.careGuide.count();
  if (existingCareGuides === 0) {
    for (const [i, g] of CARE_GUIDES.entries()) {
      await prisma.careGuide.create({ data: { ...g, position: i } });
    }
  }

  console.log("Seeding policies...");
  for (const [i, p] of POLICIES.entries()) {
    const data = { slug: p.slug, title: p.title, image: p.image, sectionsJson: JSON.stringify(p.sections), position: i };
    await prisma.policy.upsert({ where: { slug: p.slug }, update: data, create: data });
  }
  await prisma.policy.deleteMany({ where: { slug: { in: RETIRED_POLICY_SLUGS } } });

  console.log("Seeding testimonials...");
  const existingTestimonials = await prisma.testimonial.count();
  if (existingTestimonials === 0) {
    for (const [i, t] of TESTIMONIALS.entries()) {
      await prisma.testimonial.create({ data: { ...t, position: i } });
    }
  } else {
    // Backfill avatars onto testimonials seeded before this field was added.
    for (const t of TESTIMONIALS) {
      await prisma.testimonial.updateMany({
        where: { name: t.name, avatar: null },
        data: { avatar: t.avatar },
      });
    }
  }

  console.log("Seeding products...");
  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    for (const p of PRODUCTS) {
      const slug = slugify(p.name);
      await prisma.product.create({
        data: {
          name: p.name,
          slug,
          category: p.category,
          subcategory: p.subcategory,
          description:
            "A meticulously sourced piece from our curated collection, chosen for its texture, drape and craftsmanship. Every weave in this piece reflects generations of technique passed down through master artisans.",
          shortDescription: "Handpicked for texture, drape and craftsmanship.",
          price: p.price,
          priceUnit: p.priceUnit ?? "per metre",
          material: p.material,
          color: p.color,
          pattern: p.pattern,
          occasion: p.occasion,
          availability: "Available",
          featured: p.featured ?? false,
          images: { create: p.images.map((img, i) => ({ src: img.src, alt: img.alt, position: i })) },
        },
      });
    }
  } else {
    console.log("  products already exist, skipping");
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
