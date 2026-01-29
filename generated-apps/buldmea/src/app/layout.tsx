import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BULDMEA",
  description: "BULD ME A WEBSITE OF A LOG ANYLTICS TOOL FOR COLECTING ALL L",
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