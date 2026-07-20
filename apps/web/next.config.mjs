/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Empacota só o necessário para rodar, sem exigir node_modules inteiro na
  // imagem — essencial na VPS de 961 MB (ver apps/web/Dockerfile).
  output: "standalone",
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,

  // A API tem os seus próprios headers (ver apps/api/src/main.ts); estes
  // valem para as páginas servidas pelo Next.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
