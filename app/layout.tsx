import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "FinPulse - Personal & Shared Expense Management",
  description:
    "Production-ready financial intelligence platform for personal cash flows, budgets, shared room expenses, split bills, and simplified settlements.",
  keywords: ["expense tracker", "splitwise alternative", "budgeting", "shared expenses", "finance app", "settlement"],
  authors: [{ name: "FinPulse Team" }],
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans flex flex-col">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
