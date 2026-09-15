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

const TESTIMONIALS = [
  { name: "Priya Reddy", location: "Hyderabad", message: "Beautiful collection and the team helped me pick the perfect Kanchipuram silk for my sister's wedding. Highly recommend!", rating: 5, source: "Google" },
  { name: "Ananya Rao", location: "Hyderabad", message: "Their Banarasi sarees are gorgeous -- true zari work, not the machine-made stuff you find everywhere else.", rating: 5, source: "Google" },
  { name: "Sowmya K", location: "Secunderabad", message: "Personal attention, no pressure to buy, and they remembered my preferences from last visit. Lovely experience.", rating: 5, source: "Google" },
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

  console.log("Seeding testimonials...");
  const existingTestimonials = await prisma.testimonial.count();
  if (existingTestimonials === 0) {
    for (const [i, t] of TESTIMONIALS.entries()) {
      await prisma.testimonial.create({ data: { ...t, position: i } });
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
