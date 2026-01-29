import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MealPlan",
  description: "Plan meals effortlessly",
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