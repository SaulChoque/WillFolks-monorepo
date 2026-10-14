import { getTranslations } from "next-intl/server";
import { PROJECT_PAGES, type ProjectPage } from "@/lib/site";
import { SectionHead } from "../ui/SectionHead";
import { SplitWords } from "../ui/SplitWords";
import { TransitionLink } from "../ui/TransitionLink";

interface ProjectHeaderProps {
  page: ProjectPage;
  title: string;
  highlight?: string[];
  lede: string;
}

/** Head strip, rising title, lede and the switch between the project pages. */
export async function ProjectHeader({ page, title, highlight, lede }: ProjectHeaderProps) {
  const t = await getTranslations("project");
  const index = PROJECT_PAGES.indexOf(page) + 1;

  return (
    <header className="proj__head wrap">
      <SectionHead index={`P${index}`} tag={t("tag")} meta={t("meta")} />
      <h1 className="proj__title display">
        <SplitWords text={title} highlight={highlight} />
      </h1>
      <p className="proj__lede">{lede}</p>
      <nav className="proj__switch mono" aria-label={t("nav.label")}>
        {PROJECT_PAGES.map((id) =>
          id === page ? (
            <span key={id} aria-current="page">
              {t(`nav.${id}`)}
            </span>
          ) : (
            <TransitionLink key={id} href={`/${id}`}>
              {t(`nav.${id}`)}
            </TransitionLink>
          ),
        )}
      </nav>
    </header>
  );
}
