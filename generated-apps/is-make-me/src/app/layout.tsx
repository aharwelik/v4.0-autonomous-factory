import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "is Make me",
  description: "is Make me A company that cpatures all logs on windows sytem",
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