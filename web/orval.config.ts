import { defineConfig } from "orval";

/**
 * バックエンドの OpenAPI 仕様（web/openapi.json）から Zod スキーマを生成します。
 * 生成物は web/lib/generated/schemas.ts で、コミットします。
 * 仕様を変えたら `npm run api:generate` を実行してください。
 */
export default defineConfig({
  ikotabi: {
    input: { target: "./openapi.json" },
    output: {
      client: "zod",
      mode: "single",
      target: "./lib/generated/schemas.ts",
      override: { zod: { version: 4 } },
    },
  },
});
