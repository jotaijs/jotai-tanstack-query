import type { Metadata } from "next";
import AppProviders from "./providers";


export const metadata: Metadata = {
  title: "Jotai + Tanstack Query SSR Example",
};

export default function RootLayout({
  children,
}:{
  children: React.ReactNode;
}) {
  return (
     <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

