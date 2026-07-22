"use client";

import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-6xl font-extrabold"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          About
        </motion.h1>
      </div>
    </div>
  );
}
