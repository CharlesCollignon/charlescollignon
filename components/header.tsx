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
      className="fixed top-4 inset-x-0 z-50 md:px-12 backdrop-blur-md p-2 w-min mx-auto rounded-2xl"
    >
      <nav className="flex items-center justify-center w-full">
        <div className="flex items-center gap-8">
          <div className="items-center flex gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex">
            <HoverLink
              href="#about"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              About
            </HoverLink>
            <HoverLink
              href="#work"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Work
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
