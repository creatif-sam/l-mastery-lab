import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { PageViewTracker } from "@/components/page-view-tracker";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Language Mastery Lab",
  description: "Mastering languages through collaboration with AI and human intelligence.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NotificationProvider>
            <PageViewTracker />
            {children}
          </NotificationProvider>
          <Toaster richColors position="top-right" closeButton />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
