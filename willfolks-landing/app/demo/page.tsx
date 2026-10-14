import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VideoPage } from "../components/project/VideoPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("project.demo");
  return { title: t("metaTitle"), description: t("lede") };
}

export default function Page() {
  return <VideoPage video="demo" />;
}
