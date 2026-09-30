import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppProvider } from "@/components/app-provider";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
export const metadata: Metadata = {
  title: "VidaFinanceira",
  description: "Sua vida financeira em perspectiva.",
  applicationName: "VidaFinanceira",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VidaFinanceira",
  },
  icons: { icon: "/icon.svg", apple: "/icons/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#176e55",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
