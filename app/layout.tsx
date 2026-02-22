import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FutureLab - Lernstrecken",
  description: "Entdecke unsere interaktiven Lernstrecken",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="light" data-theme="light">
      <body className={`${inter.className} bg-slate-100 text-black`}>{children}</body>
    </html>
  );
}
