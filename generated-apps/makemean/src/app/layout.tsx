import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Makemean",
  description: "Make me an MSP company that sells log analytics tools to tro",
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