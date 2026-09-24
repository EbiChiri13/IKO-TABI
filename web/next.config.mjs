/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.IKOTABI_API_ORIGIN || "http://localhost:8000";

const nextConfig = {
  async rewrites() {
    // 開発中は Next.js のサーバーから FastAPI (app/main.py) へ橋渡しする。
    // 本番では両方を同じオリジンで配信するか、リバースプロキシで束ねる想定。
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
  // ngrok/cloudflared 等のトンネル経由で開発サーバーに触るときは、
  // そのホスト名をここに追加しないと CSS/フォント/HMR がブロックされ、UI が崩れて見える。
  allowedDevOrigins: (process.env.IKOTABI_DEV_ORIGINS || "").split(",").filter(Boolean),
};

export default nextConfig;
