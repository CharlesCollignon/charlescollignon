import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <main id="main" className="page-x flex min-h-dvh flex-col items-start justify-center gap-6">
      <p className="eyebrow text-zinc-500">404</p>
      <h1 className="text-display font-semibold">{t("title")}</h1>
      <p className="text-lead text-zinc-500">{t("body")}</p>
      <Link
        href="/"
        className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        {t("home")}
      </Link>
    </main>
  );
}
