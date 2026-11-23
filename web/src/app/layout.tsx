import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maintain | Maintenance Operations",
  description: "Connect maintenance requests, work orders, assets, technicians, and inventory in one accountable operations workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
