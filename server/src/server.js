const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const prisma = require("./config/db");

const PORT = process.env.PORT || 5000;
let server;

const shutdown = async (code = 0) => {
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
  } catch (error) {
    console.error("⚠️ Error during shutdown:", error);
  } finally {
    process.exit(code);
  }
};

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("🗄️ Database connected successfully");

    server = app.listen(PORT, () => {
      console.log(`🚀 Splitora server is running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await shutdown(1);
  }
};

process.on("unhandledRejection", async (reason) => {
  console.error("⚠️ Unhandled Rejection:", reason);
  await shutdown(1);
});

process.on("uncaughtException", async (error) => {
  console.error("💥 Uncaught Exception:", error);
  await shutdown(1);
});

startServer();
