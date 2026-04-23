import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORS Incident Module",
  description: "IT Support Incident Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
