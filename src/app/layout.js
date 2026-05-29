import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Búnker Logístico | Ing. Daniel García",
  description: "Terminal de Operaciones y Telemetría - Infraestructura Clandestina V3",
  keywords: ["Logística", "Ingeniería Civil", "Telemetría", "Radar", "Daniel García"],
  authors: [{ name: "ManuExplora", url: "https://github.com/DanielG0595ing" }],
  openGraph: {
    title: "CENTRO DE COMANDO | MISIONES ACTIVAS",
    description: "Matriz de control logístico y rastreo satelital. Acceso restringido a personal autorizado.",
    url: "https://front-dany.vercel.app/", // Aquí luego pondremos el dominio real
    siteName: "Vanguardia V3",
    type: "website",
  },
  icons: {
    // Si en el futuro quiere agregar un logo personalizado de radar en la pestaña
    icon: "/favicon.ico", 
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
