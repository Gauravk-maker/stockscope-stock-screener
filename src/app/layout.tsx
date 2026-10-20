import type { Metadata } from "next";
// CSS is processed by Next.js at runtime; suppress TypeScript's missing declaration warning.
// @ts-ignore
import "./globals.css";
import Providers from "./providers";
export const metadata: Metadata = {
  title: "StockScope — Real-Time Stock Screener",
  description:
    "Explore stocks, screen market data, track portfolios and monitor price alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>

        </body>
    </html>
  );
}