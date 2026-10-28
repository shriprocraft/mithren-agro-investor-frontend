import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { ToastProvider } from "@/components/common/feedback";
import { DemoProvider } from "@/context/DemoContext";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Mithren Agro Investor Portal (Demo)", template: "%s · Mithren Agro Investor Portal (Demo)" },
  description: "Frontend-only prototype. All data is fictional sample data; no real money moves.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <MotionConfig reducedMotion="user">
          <DemoProvider>
            <ToastProvider>{children}</ToastProvider>
          </DemoProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
