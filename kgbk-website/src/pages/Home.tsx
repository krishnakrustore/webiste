import { useDocumentMeta } from "../hooks/useDocumentMeta";
import HeroSlider from "../components/home/HeroSlider";
import CategoryGrid from "../components/home/CategoryGrid";
import FeaturedFabrics from "../components/home/FeaturedFabrics";
import EditorialSection from "../components/home/EditorialSection";
import OccasionGrid from "../components/home/OccasionGrid";
import FabricChips from "../components/home/FabricChips";
import StoreExperience from "../components/home/StoreExperience";
import Testimonials from "../components/home/Testimonials";
import WhatsAppCTA from "../components/home/WhatsAppCTA";

export default function Home() {
  useDocumentMeta(
    "Krishna Gari Battala Kottu | Premium Fabrics & Sarees in Hyderabad",
    "Krishna Gari Battala Kottu is a premium fabric and saree studio in Jubilee Hills, Hyderabad. Shop Banarasi, Kanchipuram silk, designer sarees and wedding collections online or enquire on WhatsApp."
  );

  return (
    <>
      <h1 className="sr-only">
        Krishna Gari Battala Kottu &mdash; Premium Fabrics, Silk Sarees &amp; Designer Wear in Jubilee Hills, Hyderabad
      </h1>
      <HeroSlider />
      <CategoryGrid />
      <FeaturedFabrics />
      <OccasionGrid />
      <EditorialSection
        eyebrow="Signature Collection"
        title="Where Heritage Meets the Present"
        body="Our designer edit reinterprets classic weaves through a contemporary lens — considered colour palettes, modern drapes and finishing that feels as at home at a gallery opening as it does at a wedding."
        image="https://images.pexels.com/photos/6843237/pexels-photo-6843237.jpeg?auto=compress&cs=tinysrgb&w=1000"
        cta={{ label: "Shop Designer Wear", to: "/collection/designer-wear" }}
        reverse
      />
      <FabricChips />
      <StoreExperience />
      <Testimonials />
      <WhatsAppCTA />
    </>
  );
}
