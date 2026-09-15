import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, PhoneCall } from "lucide-react";
import { buildWhatsAppLink, buildGeneralEnquiryMessage } from "../../config/business";
import ScheduleCallModal from "./ScheduleCallModal";

export default function FloatingActionButton() {
  const [scheduleOpen, setScheduleOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setScheduleOpen(true)}
          aria-label="Schedule a call"
          className="w-12 h-12 rounded-full bg-white text-wine shadow-[0_8px_24px_-8px_rgba(20,20,20,0.35)] border border-charcoal/8 flex items-center justify-center"
        >
          <PhoneCall size={18} />
        </motion.button>

        <motion.a
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          href={buildWhatsAppLink(buildGeneralEnquiryMessage())}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_-8px_rgba(37,211,102,0.7)] flex items-center justify-center"
        >
          <MessageCircle size={24} />
        </motion.a>
      </div>

      <AnimatePresence>{scheduleOpen && <ScheduleCallModal onClose={() => setScheduleOpen(false)} />}</AnimatePresence>
    </>
  );
}
