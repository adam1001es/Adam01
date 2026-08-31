import { defineConfig } from "vitest/config";

// Deckt bewusst nur "lib/**" ab (reine, DB-/netzwerkfreie Logik - siehe README, Abschnitt
// "Tests", für die Testphilosophie dieses Projekts: keine Tests gegen eine echte Datenbank oder
// externe APIs, dafür gibt es die manuellen Smoke-Tests pro Feature).
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
