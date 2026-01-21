"use client";

import { motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { HoverLink } from "./animations";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-6 md:px-12 w-full backdrop-blur-md"
    >
      <nav className="flex items-center justify-center w-full">
        <div className="flex items-center gap-8">
          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex">
            <HoverLink
              href="#work"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Work
            </HoverLink>
            <HoverLink
              href="#about"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              About
            </HoverLink>
            <HoverLink
              href="#contact"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Contact
            </HoverLink>
          </div>
          <ThemeToggle />
        </div>
      </nav>
    </motion.header>
  );
}
