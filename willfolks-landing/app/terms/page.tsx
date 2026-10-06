import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { TERMS } from "@/content/legal/terms";
import type { Locale } from "@/lib/site";
import { LegalDocument } from "../components/legal/LegalDocument";

export async function generateMetadata(): Promise<Metadata> {
  const doc = TERMS[(await getLocale()) as Locale] ?? TERMS.en;
  return { title: doc.title, description: doc.summary };
}

export default async function TermsPage() {
  const doc = TERMS[(await getLocale()) as Locale] ?? TERMS.en;
  return <LegalDocument doc={doc} kind="terms" />;
}
