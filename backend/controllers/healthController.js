import mongoose from "mongoose";

const databaseStates = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export function getHealth(_request, response) {
  const database = databaseStates[mongoose.connection.readyState] || "unknown";
  const connected = database === "connected";

  response.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "degraded",
    service: "textile-shop-api",
    database: {
      status: database,
      connected,
    },
  });
}
