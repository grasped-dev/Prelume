import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prelume",
  description: "Career intelligence signal briefing",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Prelume",
    description: "Career intelligence signal briefing",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prelume",
    description: "Career intelligence signal briefing",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
