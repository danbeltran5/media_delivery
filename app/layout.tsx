import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Work_Sans, News_Cycle, Ramaraja } from "next/font/google";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const newsCycle = News_Cycle({
  variable: "--font-label",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const ramaraja = Ramaraja({
  variable: "--font-display",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Client Video Portal",
  description: "Watch and download your videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${workSans.variable} ${newsCycle.variable} ${ramaraja.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page text-primary font-body">
        {children}
        <Script
          src="https://embed.cloudflarestream.com/embed/sdk.latest.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
