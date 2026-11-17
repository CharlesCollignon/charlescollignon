import { useTranslations } from "next-intl";
import { CHARACTER_CREDIT } from "@/lib/site";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="pb-6 pt-2">
      <div className="page-x flex flex-col items-start justify-between gap-3 text-xs opacity-70 sm:text-sm md:flex-row md:items-center">
        <p>
          © {new Date().getFullYear()} Charles Collignon. {t("rights")}
        </p>
        <div className="flex flex-col gap-1 md:items-center">
          <p>{t("built")}</p>
          <a
            href={CHARACTER_CREDIT.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            {t("credit", { title: CHARACTER_CREDIT.title, author: CHARACTER_CREDIT.author })}
          </a>
        </div>
        <a href="#main" className="underline-offset-4 hover:underline">
          {t("top")} ↑
        </a>
      </div>
    </footer>
  );
}
