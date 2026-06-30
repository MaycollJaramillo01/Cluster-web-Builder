import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Cluster Web Builder",
  description:
    "Convierte un brief en el primer borrador editable de un sitio web profesional.",
  icons: { icon: [{ url: "/icon.png", type: "image/png", sizes: "32x32" }] },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Fonts used by the generated-site design presets (see lib/site/design.ts). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Playfair+Display:wght@500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
