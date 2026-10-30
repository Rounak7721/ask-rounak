import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/config";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

const description = "A voice bot that answers interview questions the way Rounak would. Ask about his work, projects and background, out loud.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Ask Rounak",
  description,
  applicationName: "Ask Rounak",
  authors: [{ name: "Rounak Sonavane" }],
  openGraph: { title: "Ask Rounak", description, url: "/", siteName: "Ask Rounak", type: "website" },
  twitter: { card: "summary_large_image", title: "Ask Rounak", description },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
