import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { buildWhatsAppLink } from "../../config/business";
import WhatsAppIcon from "./WhatsAppIcon";
import clsx from "clsx";

interface Props {
  message: string;
  label?: string;
  variant?: "solid" | "outline" | "ghost";
  size?: "md" | "lg";
  className?: string;
  showArrow?: boolean;
}

export default function WhatsAppButton({
  message,
  label = "Chat on WhatsApp",
  variant = "solid",
  size = "md",
  className,
  showArrow = false,
}: Props) {
  const base =
    "group inline-flex items-center gap-2.5 font-sans font-medium tracking-wide transition-all duration-300 ease-out";
  const sizes = size === "lg" ? "px-8 py-4 text-sm" : "px-6 py-3 text-[13px]";
  const variants: Record<string, string> = {
    solid: "bg-wine text-ivory hover:bg-wine-dark shadow-[0_8px_28px_-8px_rgba(14,174,212,0.45)] hover:shadow-[0_10px_32px_-6px_rgba(14,174,212,0.6)]",
    outline: "border border-charcoal/25 text-charcoal hover:border-gold hover:text-wine",
    ghost: "text-ivory hover:text-gold-light",
  };

  return (
    <motion.a
      href={buildWhatsAppLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={clsx(base, sizes, variants[variant], "rounded-full", className)}
    >
      <WhatsAppIcon size={16} className="transition-transform duration-300 group-hover:scale-110" />
      <span>{label}</span>
      {showArrow && (
        <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
    </motion.a>
  );
}
