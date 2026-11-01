import mongoose from "mongoose";

let retryDelay = 5000;

export async function connectDatabase() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not configured; database-backed API requests will be unavailable.");
    return false;
  }

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    retryDelay = 5000;
    console.info("Connected to MongoDB.");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed.", {
      name: error.name,
      code: error.code,
    });
    const delay = retryDelay;
    retryDelay = Math.min(retryDelay * 2, 60000);
    const retryTimer = setTimeout(() => {
      void connectDatabase();
    }, delay);
    retryTimer.unref();
    return false;
  }
}
