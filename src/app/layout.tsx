import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

// Variable names kept as --font-inter/--font-space-grotesk (not renamed to
// match the new fonts) so globals.css's --font-body/--font-display
// indirection needs no change — only the font family loaded here changes.
const inter = Barlow({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const spaceGrotesk = Barlow_Condensed({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pension & opsparing",
  description: "Husstandens overblik over pension, investeringer og budget",
  applicationName: "Pension",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pension",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#5980A6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
