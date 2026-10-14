import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { LenisProvider } from "./components/providers/LenisProvider";
import { SnackbarProvider } from "./components/providers/SnackbarProvider";
import { TransitionProvider } from "./components/providers/TransitionProvider";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import "./globals.css";

// Brand faces (from the brand kit)
const righteous = localFont({
  src: "../public/fonts/Righteous/Righteous-Regular.ttf",
  variable: "--font-righteous",
  display: "swap",
  weight: "400",
});

const ropaSans = localFont({
  src: [
    {
      path: "../public/fonts/Ropa_Sans/RopaSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Ropa_Sans/RopaSans-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-ropa-sans",
  display: "swap",
});

// Display grotesque: variable weight + width, so one file covers the
// condensed tags and the expanded headlines.
const archivo = localFont({
  src: "../public/fonts/Archivo/Archivo-Variable.woff2",
  variable: "--font-archivo",
  display: "swap",
  weight: "100 900",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

// Terminal labels
const martianMono = localFont({
  src: "../public/fonts/Martian_Mono/MartianMono-Variable.woff2",
  variable: "--font-martian",
  display: "swap",
  weight: "100 800",
  declarations: [{ prop: "font-stretch", value: "75% 112.5%" }],
});

// Green-screen numerals
const vt323 = localFont({
  src: "../public/fonts/VT323/VT323-Regular.woff2",
  variable: "--font-vt323",
  display: "swap",
  weight: "400",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: {
      default: t("title"),
      template: "%s — WillFolks",
    },
    description: t("description"),
    keywords: t.raw("keywords") as string[],
    applicationName: "WillFolks",
  };
}

export const viewport: Viewport = {
  themeColor: "#c5ff0a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("boot");

  return (
    <html
      lang={locale}
      className={`${righteous.variable} ${ropaSans.variable} ${archivo.variable} ${martianMono.variable} ${vt323.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <SnackbarProvider>
            <LenisProvider>
              <TransitionProvider bootLines={t.raw("lines") as string[]}>
                {/* Keyed by language: a switch remounts the page so every
                    measured layout and scroll animation rebinds to the new copy. */}
                <div className="site" key={locale}>
                  <Navbar />
                  {children}
                  <Footer />
                </div>
              </TransitionProvider>
            </LenisProvider>
          </SnackbarProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
