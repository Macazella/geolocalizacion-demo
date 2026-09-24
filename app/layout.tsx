import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PixelSnow } from "@/components/reactbits/PixelSnow";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Property Intelligence AR — Encontrá tu próxima propiedad",
  description:
    "Reunimos publicaciones inmobiliarias de múltiples fuentes, identificamos anuncios repetidos y te ayudamos a comparar opciones en un solo lugar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* fixed + z-index negativo: decorativo de fondo, nunca intercepta clicks ni tapa contenido */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <PixelSnow />
        </div>
        {children}
      </body>
    </html>
  );
}
