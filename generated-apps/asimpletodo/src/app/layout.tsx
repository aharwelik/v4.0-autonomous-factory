import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asimpletodo",
  description: "A simple todo list app for freelancers to track their daily ",
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