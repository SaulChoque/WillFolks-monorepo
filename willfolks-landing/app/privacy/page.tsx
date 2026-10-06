import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { PRIVACY } from "@/content/legal/privacy";
import type { Locale } from "@/lib/site";
import { LegalDocument } from "../components/legal/LegalDocument";

export async function generateMetadata(): Promise<Metadata> {
  const doc = PRIVACY[(await getLocale()) as Locale] ?? PRIVACY.en;
  return { title: doc.title, description: doc.summary };
}

export default async function PrivacyPage() {
  const doc = PRIVACY[(await getLocale()) as Locale] ?? PRIVACY.en;
  return <LegalDocument doc={doc} kind="privacy" />;
}
