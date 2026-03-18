const dotenv = require("dotenv");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const globalForPrisma = global;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pool = globalForPrisma.__splitoraPgPool || new Pool({ connectionString: databaseUrl });
const adapter = globalForPrisma.__splitoraPrismaAdapter || new PrismaPg(pool);

const prisma = globalForPrisma.__splitoraPrisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__splitoraPgPool = pool;
  globalForPrisma.__splitoraPrismaAdapter = adapter;
  globalForPrisma.__splitoraPrisma = prisma;
}

prisma
  .$connect()
  .then(() => {
    console.log("Prisma connected for Splitora");
  })
  .catch((error) => {
    console.error("Prisma connection failed:", error);
  });

module.exports = prisma;
module.exports.default = prisma;
