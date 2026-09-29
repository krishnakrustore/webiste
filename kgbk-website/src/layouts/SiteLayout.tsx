import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import FloatingActionButton from "../components/layout/FloatingActionButton";
import CartDrawer from "../components/layout/CartDrawer";
import AuthModal from "../components/layout/AuthModal";
import TimedAuthPrompt from "../components/layout/TimedAuthPrompt";
import Marquee from "../components/home/Marquee";

const SITE_URL = "https://krishnagaribattalakottu.com";

export default function SiteLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  // One canonical URL per page, on the real domain, ignoring tracking/search params (occasion filters are real pages).
  useEffect(() => {
    const occasion = new URLSearchParams(location.search).get("occasion");
    const href = `${SITE_URL}${location.pathname}${occasion ? `?occasion=${encodeURIComponent(occasion)}` : ""}`;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen flex flex-col">
      <Marquee />
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
      <FloatingActionButton />
      <CartDrawer />
      <AuthModal />
      <TimedAuthPrompt />
    </div>
  );
}
