import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { CareerProvider } from "@/lib/store/career-store";

export const metadata: Metadata = {
  title: "Orosu — Your job search, without the busywork",
  description: "AI-native career workspace and structured job application platform.",
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F8F8F6] text-[#111111]">
        <AuthProvider>
          <CareerProvider>{children}</CareerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
