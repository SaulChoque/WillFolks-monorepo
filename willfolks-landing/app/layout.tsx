import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { LenisProvider } from "./components/LenisProvider";
import { SnackbarProvider } from "./components/SnackbarProvider";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "WillFolks — Put your money where your goals are",
  description:
    "Achieve your goals through gamified savings. Stake on alarms, app timers, location goals, and more. Powered by blockchain.",
  keywords: [
    "WillFolks",
    "gamified savings",
    "goal tracking",
    "blockchain",
    "staking",
    "alarms",
    "productivity",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${righteous.variable} ${ropaSans.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <SnackbarProvider>
            <LenisProvider>{children}</LenisProvider>
          </SnackbarProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
