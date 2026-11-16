import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="pb-6 pt-2">
      <div className="page-x flex flex-col items-start justify-between gap-3 text-xs opacity-70 sm:text-sm md:flex-row md:items-center">
        <p>
          © {new Date().getFullYear()} Charles Collignon. {t("rights")}
        </p>
        <p>{t("built")}</p>
        <a href="#main" className="underline-offset-4 hover:underline">
          {t("top")} ↑
        </a>
      </div>
    </footer>
  );
}
