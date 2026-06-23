import type { Metadata, Viewport } from "next";
import { Nunito, DM_Sans } from "next/font/google";
import "./globals.css";
import { IdentityProvider } from "@/lib/webappUser";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dmsans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Soonest — fill your day with people",
  description:
    "Drop a pin, join what's happening near you. Spontaneous hangouts on a live map — no account needed to join.",
  openGraph: {
    title: "Soonest — fill your day with people",
    description: "Spontaneous hangouts on a live map. Join in one tap.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#7C3AED",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${dmSans.variable}`}>
      <body>
        <IdentityProvider>{children}</IdentityProvider>
      </body>
    </html>
  );
}
