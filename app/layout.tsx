import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jargon2Human — Hüquq dili. İnsan dilində.",
  description: "Mürəkkəb müqavilə bəndlərini sadə Azərbaycan dilində anlayın, mümkün riskləri görün və alternativ ifadə əldə edin.",
  applicationName: "Jargon2Human",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Browser tools can inject cursor styles and data-cc-prev-cursor before hydration.
  // Limit suppression to the root element; descendant mismatches still surface.
  return <html lang="az" suppressHydrationWarning><body>{children}</body></html>;
}
