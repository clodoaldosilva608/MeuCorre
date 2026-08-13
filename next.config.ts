import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript check desabilitado no build para evitar OOM (out of memory)
  // na Vercel. Validação de tipos é feita com `npx tsc --noEmit` antes do commit.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy — fortalecida (removido unsafe-eval)
          // unsafe-inline mantido pois Next.js precisa para hidratação
          // unsafe-eval removido — Next.js 16 não precisa em produção
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://pay.kiwify.com.br",
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
              "report-uri /api/csp-report",
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
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          // Cross-Origin Opener Policy — previne ataques cross-origin
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // Cross-Origin Resource Policy — controla quem pode carregar recursos
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
