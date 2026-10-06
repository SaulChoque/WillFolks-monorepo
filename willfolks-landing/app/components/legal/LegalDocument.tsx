import { getLocale, getTranslations } from "next-intl/server";
import type { LegalDoc } from "@/content/legal/types";
import { SITE } from "@/lib/site";
import { SectionHead } from "../ui/SectionHead";
import { TransitionLink } from "../ui/TransitionLink";
import { LegalToc } from "./LegalToc";

interface LegalDocumentProps {
  doc: LegalDoc;
  kind: "terms" | "privacy";
}

export async function LegalDocument({ doc, kind }: LegalDocumentProps) {
  const t = await getTranslations("legal");
  const locale = await getLocale();
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(SITE.legalUpdated),
  );
  const other = kind === "terms" ? "privacy" : "terms";

  return (
    <main className="legal theme-ink">
      <header className="legal__head wrap">
        <SectionHead index="§" tag={t("tag")} meta={`${t("updated")} ${updated}`} />
        <h1 className="legal__title display">{doc.title}</h1>
        <p className="legal__summary">{doc.summary}</p>
        <div className="legal__switch mono">
          <span aria-current="page">{t(kind)}</span>
          <TransitionLink href={`/${other}`}>{t(other)} →</TransitionLink>
        </div>
      </header>

      <div className="legal__body wrap">
        <LegalToc
          label={t("contents")}
          items={doc.sections.map(({ id, title }) => ({ id, title }))}
        />

        <article className="legal__article">
          {doc.sections.map((section, i) => (
            <section key={section.id} id={section.id} className="legal__section">
              <h2>
                <span className="pixel" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              {section.body.map((block, j) =>
                typeof block === "string" ? (
                  <p key={j}>{block}</p>
                ) : (
                  <ul key={j}>
                    {block.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ),
              )}
            </section>
          ))}

          <aside className="legal__contact hud">
            <p className="mono">{t("contactLabel")}</p>
            <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
          </aside>
        </article>
      </div>
    </main>
  );
}
