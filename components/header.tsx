"use client";

import { ThemeToggle } from "./theme-toggle";
import { HoverLink } from "./animations";
import FadeContent from "@/components/FadeContent";

export function Header() {
  return (
    <FadeContent
      blur={true}
      delay={5000}
      duration={2000}
      ease="ease-out"
      initialOpacity={0}
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
    </FadeContent>
  );
}
