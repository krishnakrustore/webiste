import { useEffect } from "react";
import { motion } from "framer-motion";
import SectionHeading from "../components/ui/SectionHeading";
import EditorialSection from "../components/home/EditorialSection";
import WhatsAppCTA from "../components/home/WhatsAppCTA";

export default function About() {
  useEffect(() => {
    document.title = "About | Krishna Gari Battala Kottu";
  }, []);

  return (
    <div>
      <section className="pt-16 md:pt-24 pb-10">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <SectionHeading eyebrow="Our Story" title="A Textile House Rooted in Hyderabad" align="center" />
        </div>
      </section>

      <EditorialSection
        eyebrow="Since the beginning"
        title="Fabric, Chosen With Care"
        body="Krishna Gari Battala Kottu began as a family pursuit of fine textiles — a belief that the right fabric changes how an occasion is remembered. Today, from our store near Peddamma Temple in Jubilee Hills, we work directly with weaving clusters across India to bring authentic silk, cotton and designer fabrics to Hyderabad."
        image="https://images.pexels.com/photos/33078836/pexels-photo-33078836.jpeg?auto=compress&cs=tinysrgb&w=1000"
        cta={{ label: "Explore the Collection", to: "/collection" }}
      />
      <EditorialSection
        eyebrow="How we work"
        title="Personal, By Design"
        body="We don't run an online checkout — every enquiry becomes a conversation. Browse our catalogue, find what speaks to you, and message us directly on WhatsApp. Our team will guide you through availability, customisation and pricing, just as they would in the store."
        image="https://images.pexels.com/photos/28943572/pexels-photo-28943572.jpeg?auto=compress&cs=tinysrgb&w=1000"
        reverse
        cta={{ label: "Visit Our Store", to: "/contact" }}
      />

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <WhatsAppCTA />
      </motion.div>
    </div>
  );
}
