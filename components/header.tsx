"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { ThemeToggle } from "./theme-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import { useActiveSection } from "@/hooks/use-active-section";
import { useLenis } from "@/components/providers/smooth-scroll";
import { cn } from "@/lib/utils";

const SECTIONS = ["about", "work", "contact"] as const;
const EASE = [0.16, 1, 0.3, 1] as const;

/** On the home page sections are anchors; elsewhere they point back home. */
function NavLink({
  id,
  onHome,
  ...props
}: { id: string; onHome: boolean } & Omit<React.ComponentProps<"a">, "href">) {
  return onHome ? (
    <a href={`#${id}`} {...props} />
  ) : (
    <Link href={`/#${id}`} {...props} />
  );
}

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "en" ? "fr" : "en";
  const active = useActiveSection([...SECTIONS]);
  const lenis = useLenis();
  const [open, setOpen] = useState(false);
  const onHome = pathname === "/";

  // Lock scrolling behind the open menu; close it with Escape.
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lenis]);

  const pill =
    "flex items-center gap-1 rounded-full border border-zinc-900/10 bg-white/85 p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80";

  return (
    <>
      <div
        className="css-fade fixed inset-x-0 top-3 z-50 flex justify-center px-3 md:top-4"
        style={{ animationDelay: "1.3s" }}
      >
        <nav aria-label="Main" className={pill}>
          <NavLink
            id="main"
            onHome={onHome}
            aria-label={t("home")}
            className="flex size-10 items-center justify-center rounded-full text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            CC
          </NavLink>

          <ul className="hidden items-center md:flex">
            {SECTIONS.map((id) => (
              <li key={id} className="relative">
                {active === id && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full bg-zinc-900/[0.07] dark:bg-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <NavLink
                  id={id}
                  onHome={onHome}
                  aria-current={active === id ? "true" : undefined}
                  className={cn(
                    "relative block rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active === id
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white",
                  )}
                >
                  {t(id)}
                </NavLink>
              </li>
            ))}
          </ul>

          <span
            aria-hidden
            className="mx-1 hidden h-5 w-px bg-zinc-900/10 md:block dark:bg-white/10"
          />

          <Link
            href={pathname}
            locale={other}
            aria-label={t("switchTo")}
            className="flex size-10 items-center justify-center rounded-full text-xs font-semibold uppercase tracking-wider text-zinc-600 transition-colors hover:bg-zinc-900/[0.07] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {other}
          </Link>
          <ThemeToggle label={t("theme")} />

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white md:hidden dark:bg-white dark:text-zinc-900"
          >
            {t("menu")}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t("menu")}
            className="fixed inset-0 z-60 flex flex-col bg-zinc-950 px-gutter pb-10 pt-4 text-white md:hidden"
            initial={{ clipPath: "circle(0% at 85% 2.5rem)" }}
            animate={{ clipPath: "circle(150% at 85% 2.5rem)" }}
            exit={{ clipPath: "circle(0% at 85% 2.5rem)" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Charles Collignon</span>
              <button
                type="button"
                autoFocus
                onClick={() => setOpen(false)}
                className="h-10 rounded-full border border-white/20 px-4 text-sm font-medium"
              >
                {t("close")}
              </button>
            </div>

            <ul className="mt-auto flex flex-col gap-2">
              {SECTIONS.map((id, i) => (
                <li key={id} className="overflow-hidden">
                  <motion.a
                    href={onHome ? `#${id}` : `${locale === "en" ? "" : `/${locale}`}/#${id}`}
                    onClick={() => setOpen(false)}
                    className="block text-[clamp(3rem,14vw,5rem)] font-semibold leading-[1.05] tracking-tight"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "110%" }}
                    transition={{ duration: 0.6, delay: 0.15 + i * 0.06, ease: EASE }}
                  >
                    {t(id)}
                  </motion.a>
                </li>
              ))}
            </ul>

            <motion.div
              className="mt-10 flex items-center justify-between border-t border-white/15 pt-6 text-sm text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.4 } }}
              exit={{ opacity: 0 }}
            >
              <Link href={pathname} locale={other} onClick={() => setOpen(false)}>
                {t("switchTo")}
              </Link>
              <span>Paris</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
