import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n-context";
import { LanguageStateProvider } from "@/components/language-state-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Emperor Coffee POS - Multi-Branch Point of Sale",
  description: "Professional multi-branch coffee shop franchise management system with centralized control",
  keywords: ["POS", "Coffee", "Franchise", "Multi-branch", "Emperor Coffee"],
  authors: [{ name: "Emperor Coffee" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Emperor Coffee POS",
    description: "Multi-branch coffee shop management system",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <LanguageStateProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        >
          <I18nProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster />
          </I18nProvider>
        </body>
      </LanguageStateProvider>
    </html>
  );
}
