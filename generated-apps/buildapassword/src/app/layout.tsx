import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buildapassword",
  description: "Build a password manager app",
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