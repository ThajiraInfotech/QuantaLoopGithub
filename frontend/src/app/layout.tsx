import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari, Noto_Sans_Tamil, Sora } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "react-hot-toast";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-tamil",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Quanta Loop",
    template: "%s · Quanta Loop",
  },
  description:
    "Premium industrial byproduct recovery network — intelligent matching and operational coordination for providers and buyers.",
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
      className={`${inter.variable} ${sora.variable} ${notoSansDevanagari.variable} ${notoSansTamil.variable}`}
    >
      <body className="min-h-full font-sans">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            className:
              "!rounded-lg !border !border-border !bg-card !text-small !text-foreground !shadow-elevated",
          }}
        />
      </body>
    </html>
  );
}
