import type { Metadata } from "next";
import { Inter, Open_Sans } from "next/font/google";
import { StoreProvider } from "@/components/providers/StoreProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Umurava Screening",
  description: "AI-powered recruiting and candidate screening platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${openSans.variable}`}>
      <body suppressHydrationWarning>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
