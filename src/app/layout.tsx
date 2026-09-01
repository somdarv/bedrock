import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

/** Display face — headings, money figures, the wordmark. */
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Body face — everything else. */
const generalSans = localFont({
  src: "./fonts/GeneralSans-Variable.woff2",
  variable: "--font-general",
  weight: "200 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bedrock — SaharaBase",
    template: "%s · Bedrock",
  },
  description: "Client management & gated-delivery payment system for SaharaBase Technologies.",
};

/**
 * Without this, phones lay the page out at the 980px fallback width and scale it
 * down — which silently defeats every responsive rule in the app, documents included.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${generalSans.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
