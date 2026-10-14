import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProjectHeader } from "../components/project/ProjectHeader";
import { ProjectMotion } from "../components/project/ProjectMotion";
import { TransitionLink } from "../components/ui/TransitionLink";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("project.gtm");
  return { title: t("metaTitle"), description: t("lede") };
}

interface GtmSection {
  id: string;
  title: string;
  body: string[];
  list?: { title: string; body: string }[];
  after?: string;
}

interface Phase {
  step: string;
  title: string;
  body: string;
}

export default async function GtmPage() {
  const t = await getTranslations("project.gtm");
  const sections = t.raw("sections") as GtmSection[];
  const phases = t.raw("phases.items") as Phase[];

  return (
    <ProjectMotion className="proj theme-ink">
      <ProjectHeader
        page="gtm"
        title={t("title")}
        highlight={t.raw("titleHighlight") as string[]}
        lede={t("lede")}
      />

      <div className="wrap">
        <p className="proj__pull display reveal">
          <span>{t("pull")}</span>
        </p>

        <div className="proj__doc">
          {sections.map((section, i) => (
            <section key={section.id} id={section.id} className="proj__block">
              <h2 className="proj__block-title">
                <span className="pixel" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              <div className="reveal">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="proj__para">
                    {paragraph}
                  </p>
                ))}
              </div>

              {section.id === "learn" ? (
                <ol className="proj__phases reveal">
                  {phases.map((phase) => (
                    <li key={phase.title} className="proj__phase hud">
                      <span className="mono">{phase.step}</span>
                      <h3>{phase.title}</h3>
                      <p>{phase.body}</p>
                    </li>
                  ))}
                </ol>
              ) : null}

              {section.list ? (
                <ul className="proj__revenue reveal">
                  {section.list.map((item, j) => (
                    <li key={item.title} className="proj__step hud">
                      <span className="pixel proj__step-n" aria-hidden="true">
                        {String.fromCharCode(65 + j)}
                      </span>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </li>
                  ))}
                </ul>
              ) : null}

              {section.after ? <p className="proj__para reveal">{section.after}</p> : null}
            </section>
          ))}
        </div>

        <div className="proj__foot">
          <TransitionLink href="/live" className="btn btn--acid">
            {t("cta")} <span className="btn__arrow" aria-hidden="true">→</span>
          </TransitionLink>
          <TransitionLink href="/pitch" className="btn btn--line">
            {t("ctaPitch")} <span className="btn__arrow" aria-hidden="true">→</span>
          </TransitionLink>
        </div>
      </div>
    </ProjectMotion>
  );
}
