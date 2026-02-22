import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sigma DOCs - Sistema de Gestão Eletrônica de Documentos",
  description: "Sistema completo de gestão documental com assinatura digital ICP-Brasil",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
