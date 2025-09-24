import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
<<<<<<< HEAD
  title: "Portail Bénévoles - Festival du Film Court",
  description: "Plateforme de gestion des bénévoles pour le Festival du Film Court",
=======
  title: "Festival Bénévoles v2.1.0",
  description: "Plateforme de gestion des bénévoles - Version déployée 2025",
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen`}
      >
        {/* Version 2.1.0 - Déployée avec corrections complètes */}
        {children}
      </body>
    </html>
  );
}
