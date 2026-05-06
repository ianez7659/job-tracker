"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface Props {
  xp: number;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. Default 3000. */
  duration?: number;
}

export default function XpToast({ xp, onDismiss, duration = 3000 }: Props) {
  useEffect(() => {
    if (xp <= 0) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [xp, onDismiss, duration]);

  return (
    <AnimatePresence>
      {xp > 0 && (
        <motion.div
          key="xp-toast"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-20 right-4 md:bottom-6 z-50 flex items-center gap-2 rounded-xl bg-indigo-600 dark:bg-yellow-500 px-4 py-2.5 shadow-lg text-white dark:text-gray-900 text-sm font-semibold select-none"
          role="status"
          aria-live="polite"
        >
          <Zap size={16} aria-hidden="true" />
          +{xp} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}
