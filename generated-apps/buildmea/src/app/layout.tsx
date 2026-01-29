import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buildmea",
  description: "Build me a log anyltics tool wesbsite that showsthat auto ca",
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