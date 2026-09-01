import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Spectral } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const spectral = Spectral({
  variable: "--font-spectral",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GéoEmploi — la carte des offres d'emploi",
    template: "%s — GéoEmploi",
  },
  description:
    "GéoEmploi affiche les offres d'emploi géolocalisées sur une carte ouverte à tous. Un service du Ministère du Job et Bonheur.",
  applicationName: "GéoEmploi",
  openGraph: {
    title: "GéoEmploi — la carte des offres d'emploi",
    description:
      "Les offres d'emploi géolocalisées, commune par commune. Un service du Ministère du Job et Bonheur.",
    siteName: "GéoEmploi",
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B3A6B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
