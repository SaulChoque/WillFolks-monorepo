import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TransitionLink } from "./components/ui/TransitionLink";

export const metadata: Metadata = { title: "404" };

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="nf sec--acid">
      <div className="nf__grid mono">
        <p className="nf__a">
          — 0 1<br />
          .{t("route")}
        </p>
        <p className="nf__b">
          (…) {t("searching")} ......
          <span className="blink" aria-hidden="true">
            ▮
          </span>
        </p>
        <p className="nf__c">
          © 2026
          <br />
          &gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;
        </p>

        <h1 className="nf__code pixel">
          <span aria-hidden="true">(</span>
          {t("title")}
          <span aria-hidden="true">)</span>
        </h1>

        <p className="nf__d">
          {t("please")}_ _ _ _{t("check")}_ _ _ _{t("again")}
        </p>
        <nav className="nf__links" aria-label={t("navLabel")}>
          <TransitionLink href="/">( {t("home")} )</TransitionLink>
          <TransitionLink href="/#faq">( {t("faq")} )</TransitionLink>
          <TransitionLink href="/social">( {t("social")} )</TransitionLink>
        </nav>
        <div className="nf__barcode barcode" aria-hidden="true" />
        <p className="nf__e">
          {"// "}
          {t("end")}
          <br />
          {t("number")}
        </p>
      </div>
    </main>
  );
}
