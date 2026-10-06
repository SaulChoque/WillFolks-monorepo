import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE } from "@/lib/site";
import { SocialGrid } from "../components/SocialGrid";
import { SectionHead } from "../components/ui/SectionHead";
import { TransitionLink } from "../components/ui/TransitionLink";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("social");
  return { title: t("metaTitle"), description: t("body") };
}

export default async function SocialPage() {
  const t = await getTranslations("social");

  return (
    <main className="social sec--acid">
      <div className="social__bg" aria-hidden="true">
        <div className="social__halftone" />
        <div className="social__bars stripes" />
      </div>

      <div className="wrap">
        <SectionHead index="@" tag={t("tag")} meta={t("meta")} />
        <h1 className="social__title display">{t("title")}</h1>
        <p className="social__lede">{t("body")}</p>

        <SocialGrid />

        <div className="social__foot">
          <div className="social__contact">
            <p className="mono">{t("contactLabel")}</p>
            <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
          </div>
          <TransitionLink href="/" className="btn">
            <span aria-hidden="true">←</span>
            {t("back")}
          </TransitionLink>
        </div>
      </div>
    </main>
  );
}
