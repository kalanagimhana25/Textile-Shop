import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";

const app = express();
const configuredPort = process.env.PORT?.trim();
const port = configuredPort ? Number(configuredPort) : 5000;
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
const allowedOrigins = new Set([
  "http://localhost:5173",
  ...(process.env.VERCEL_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error("Origin is not allowed by CORS.");
    error.statusCode = 403;
    callback(error);
  },
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_request, response) => {
  response.json({ service: "textile-shop-api", status: "running" });
});
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/departments", departmentRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(port, "0.0.0.0", () => {
  console.info(`Textile Shop API listening on port ${port}.`);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB connection was lost.");
});
mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error.", {
    name: error.name,
    code: error.code,
  });
});

void connectDatabase();

function shutDown(signal) {
  console.info(`${signal} received; shutting down.`);
  server.close(() => {
    void mongoose.disconnect()
      .catch((error) => {
        console.error("MongoDB shutdown failed.", {
          name: error.name,
          code: error.code,
        });
        process.exitCode = 1;
      })
      .finally(() => process.exit());
  });
}

process.on("SIGINT", () => shutDown("SIGINT"));
process.on("SIGTERM", () => shutDown("SIGTERM"));
