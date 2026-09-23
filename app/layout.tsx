import type { Metadata } from "next";
import { StoreProvider } from "@/components/providers/store-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProcureAI",
  description: "Procurement workflows, made clear.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
