import { getTranslations } from "next-intl/server";
import { VIDEOS, type VideoId } from "@/lib/site";
import { LogoMark } from "../ui/LogoMark";
import { TransitionLink } from "../ui/TransitionLink";
import { ProjectHeader } from "./ProjectHeader";
import { ProjectMotion } from "./ProjectMotion";

/** `https://youtu.be/ID` or `youtube.com/watch?v=ID` → embeddable URL; anything else is a file. */
function youtubeEmbed(src: string): string | null {
  const match = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0` : null;
}

export async function VideoPage({ video }: { video: VideoId }) {
  const t = await getTranslations(`project.${video}`);
  const tv = await getTranslations("project.video");
  const { src } = VIDEOS[video];
  const embed = src ? youtubeEmbed(src) : null;
  const others = (Object.keys(VIDEOS) as VideoId[]).filter((id) => id !== video);

  return (
    <ProjectMotion className="proj proj--video theme-ink">
      <ProjectHeader
        page={video}
        title={t("title")}
        highlight={t.raw("titleHighlight") as string[]}
        lede={t("lede")}
      />

      <div className="wrap">
        <div className="reveal">
          <figure className="vid hud">
            <div className="vid__screen">
              {embed ? (
                <iframe
                  src={embed}
                  title={t("title")}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : src ? (
                <video src={src} controls playsInline preload="metadata" />
              ) : (
                <div className="vid__soon">
                  <span className="vid__scan" aria-hidden="true" />
                  <svg className="vid__ring proj__spin" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="48" />
                  </svg>
                  <LogoMark className="vid__mark" />
                  <p className="pixel vid__label">
                    {tv("soon")}
                    <span className="blink" aria-hidden="true">
                      ▮
                    </span>
                  </p>
                  <p className="mono">{tv("soonBody")}</p>
                </div>
              )}
            </div>
            <figcaption className="vid__bar mono">
              <span>● REC</span>
              <span>{t("format")}</span>
              <span>{t("length")}</span>
            </figcaption>
          </figure>
        </div>

        <div className="proj__cols reveal">
          <section className="proj__card hud">
            <p className="mono">{tv("inside")}</p>
            <ul className="proj__list">
              {(t.raw("points") as string[]).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
          <nav className="proj__card hud" aria-label={tv("more")}>
            <p className="mono">{tv("more")}</p>
            <ul className="proj__links">
              {others.map((id) => (
                <li key={id}>
                  <TransitionLink href={`/${id}`}>
                    {tv(`links.${id}`)} <span aria-hidden="true">→</span>
                  </TransitionLink>
                </li>
              ))}
              <li>
                <TransitionLink href="/live">
                  {tv("links.live")} <span aria-hidden="true">→</span>
                </TransitionLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </ProjectMotion>
  );
}
