import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="py-6">
      <div className="page-x flex flex-col items-center justify-between gap-3 text-center text-xs text-zinc-500 sm:text-sm md:flex-row">
        <p>
          © {new Date().getFullYear()} Charles Collignon. {t("rights")}
        </p>
        <p>{t("built")}</p>
      </div>
    </footer>
  );
}
