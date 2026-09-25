import { defineRailway, github, postgres, preserve, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "sfo" });
  Postgres.networking = { privateNetworkEndpoint: "postgres" };
  const postgresVolume = volume("postgres-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "sfo", sizeMB: 500 });
  const web = service("web", {
    source: github("EbiChiri13/IKO-TABI", { checkSuites: false }),
    start: "sh -c 'uvicorn app.main:app --host 0.0.0.0 --port $PORT'",
    build: {
      watchPatterns: ["app/**", "pyproject.toml", "uv.lock", "Dockerfile", "railway.json"],
    },
    replicas: { "sfo": 1 },
    env: { DATABASE_URL: preserve(), HF_TOKEN: preserve() },
  });

  return project("miraculous-illumination", {
    resources: [Postgres, web, postgresVolume],
  });
});
