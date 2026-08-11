import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NÃO ignorar erros de TypeScript — bugs silenciosos entram em produção
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true, // ativa verificação de efeitos colaterais
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy — previne XSS, inline scripts controlados
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Allow Next.js inline scripts (hash-based CSP é mais seguro mas complexo)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pay.kiwify.com.br",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://pay.kiwify.com.br https://api.qrserver.com",
              "frame-src 'self' https://pay.kiwify.com.br",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://pay.kiwify.com.br",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // Prevenção de MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevenção de clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // HSTS — força HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Referrer policy — só manda origin pra cross-origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy — restringe APIs do navegador
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
