import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ===== Google AdSense =====
// Carregado apenas se NEXT_PUBLIC_ADSENSE_CLIENT estiver configurado.
// O script é carregado de forma assíncrona para não bloquear o render.
// Para ativar: configure NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
// no Vercel e adicione o arquivo /public/ads.txt com o conteúdo:
//   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

// Metadata do PWA MeuCorre — instalável na tela inicial do entregador.
export const metadata: Metadata = {
  title: "MeuCorre - Gestão de Entregas",
  description:
    "App para entregadores de aplicativo (iFood, 99Food, Lalamove e outros) controlarem corridas, ganhos e quilometragem. 100% offline, dados ficam no seu celular.",
  keywords: [
    "MeuCorre",
    "entregador",
    "iFood",
    "99Food",
    "Lalamove",
    "corridas",
    "ganhos",
    "PWA",
  ],
  authors: [{ name: "Clodoaldo C Silva" }],
  creator: "Clodoaldo C Silva",
  applicationName: "MeuCorre",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MeuCorre",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    title: "MeuCorre - Gestão de Entregas",
    description:
      "Controle suas corridas e ganhos por aplicativo. 100% offline.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#10b981" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Google AdSense — só carrega se configurado */}
        {ADSENSE_CLIENT && (
          <Script
            id="adsense-script"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            theme="system"
            toastOptions={{
              style: {
                background: "#18181b",
                border: "1px solid #27272a",
                color: "#f4f4f5",
              },
            }}
          />
          {/* Registro do Service Worker para PWA offline */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                      .then(() => console.log('[MeuCorre] Service Worker registrado'))
                      .catch(err => console.warn('[MeuCorre] SW erro:', err));
                  });
                }
              `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
