import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BUILD me a",
  description: "BUILD me a website for a log tool that is cutting edge, it w",
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