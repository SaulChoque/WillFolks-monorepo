import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { API_URL, CHAIN, RELEASES_URL, REPO_URL } from "@/lib/site";
import { ApiStatus } from "../components/project/ApiStatus";
import { ProjectHeader } from "../components/project/ProjectHeader";
import { ProjectMotion } from "../components/project/ProjectMotion";
import { TransitionLink } from "../components/ui/TransitionLink";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("project.live");
  return { title: t("metaTitle"), description: t("lede") };
}

const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

export default async function LivePage() {
  const t = await getTranslations("project.live");

  const facts: { label: string; value: string; href?: string }[] = [
    { label: t("status.api"), value: API_URL.replace("https://", ""), href: `${API_URL}/health` },
    { label: t("chain.network"), value: `${CHAIN.name} · ${CHAIN.id}` },
    {
      label: t("chain.escrow"),
      value: short(CHAIN.escrow),
      href: `${CHAIN.explorer}/address/${CHAIN.escrow}`,
    },
    { label: t("chain.usdc"), value: short(CHAIN.usdc), href: `${CHAIN.explorer}/address/${CHAIN.usdc}` },
    { label: t("chain.code"), value: "GitHub", href: REPO_URL },
  ];

  return (
    <ProjectMotion className="proj theme-ink">
      <ProjectHeader
        page="live"
        title={t("title")}
        highlight={t.raw("titleHighlight") as string[]}
        lede={t("lede")}
      />

      <div className="wrap">
        <div className="proj__cols reveal">
          <section className="proj__card proj__card--acid hud">
            <p className="mono">{t("get.label")}</p>
            <h2 className="proj__card-title">{t("get.title")}</h2>
            <p>{t("get.body")}</p>
            <div className="proj__actions">
              <a className="btn btn--acid" href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
                {t("get.apk")} <span aria-hidden="true">↓</span>
              </a>
              <TransitionLink href="/#demo" className="btn btn--line">
                {t("get.browser")} <span className="btn__arrow" aria-hidden="true">→</span>
              </TransitionLink>
            </div>
          </section>

          <section className="proj__card hud">
            <p className="mono">{t("status.label")}</p>
            <h2 className="proj__card-title">{t("status.title")}</h2>
            <ApiStatus />
            <dl className="proj__facts mono">
              {facts.map(({ label, value, href }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {value} ↗
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section className="proj__block">
          <h2 className="proj__block-title">
            <span className="pixel" aria-hidden="true">
              01
            </span>
            {t("steps.title")}
          </h2>
          <p className="proj__note mono">{t("steps.note")}</p>
          <ol className="proj__steps reveal">
            {(t.raw("steps.items") as { title: string; body: string }[]).map((step, i) => (
              <li key={step.title} className="proj__step hud">
                <span className="pixel proj__step-n" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="proj__block">
          <h2 className="proj__block-title">
            <span className="pixel" aria-hidden="true">
              02
            </span>
            {t("limits.title")}
          </h2>
          <ul className="proj__list proj__list--wide reveal">
            {(t.raw("limits.items") as string[]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </ProjectMotion>
  );
}
