import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LogScope",
  description: "Real-time log aggregation and analysis for it departments and msps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}