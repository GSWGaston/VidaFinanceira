import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppProvider } from "@/components/app-provider";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Ordinnum",
  description: "Sua vida financeira em perspectiva.",
  applicationName: "Ordinnum",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ordinnum",
  },
  icons: { icon: "/icon.svg", apple: "/icons/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#241512" },
  ],
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
