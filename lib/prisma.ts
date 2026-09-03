import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// $extends(withAccelerate()) leitet Anfragen über die gepoolte Prisma-Accelerate-Verbindung
// (siehe DATABASE_URL, prisma/schema.prisma) statt jeweils eine eigene direkte Datenbank-
// verbindung pro Vercel-Funktionsaufruf zu öffnen - ohne das erschöpft App-Traffic unter Last das
// (sehr niedrige) Verbindungslimit der direkten Prisma-Postgres-Verbindung, siehe README.
function createPrismaClient() {
  return new PrismaClient().$extends(withAccelerate());
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
