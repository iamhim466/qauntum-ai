"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.995 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.995 }}
        transition={{
          opacity: { duration: 0.35, ease: "easeInOut" },
          scale: { duration: 0.35, ease: "easeInOut" },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
