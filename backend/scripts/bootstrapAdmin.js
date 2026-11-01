import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import { validatePassword } from "../utils/passwordValidation.js";

const { BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD } = process.env;

function fail(message) {
  throw new Error(message);
}

async function bootstrapAdmin() {
  if (!process.env.MONGODB_URI) {
    fail("MONGODB_URI is not configured.");
  }
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
    fail("JWT_SECRET must be configured with at least 32 bytes.");
  }
  if (!BOOTSTRAP_ADMIN_NAME?.trim() || BOOTSTRAP_ADMIN_NAME.trim().length > 120) {
    fail("BOOTSTRAP_ADMIN_NAME must contain 1–120 characters.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(BOOTSTRAP_ADMIN_EMAIL?.trim() || "")) {
    fail("BOOTSTRAP_ADMIN_EMAIL must be a valid email address.");
  }
  if (!validatePassword(BOOTSTRAP_ADMIN_PASSWORD)) {
    fail("BOOTSTRAP_ADMIN_PASSWORD must be 10–72 UTF-8 bytes and include lowercase, uppercase, and numeric characters.");
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const email = BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (await User.exists({ role: "admin" }).session(session)) {
        fail("An administrator already exists; bootstrap was refused.");
      }

      if (await User.exists({ email }).session(session)) {
        fail("An account with the bootstrap email already exists; bootstrap was refused.");
      }

      await mongoose.connection.collection("admin_bootstrap_state").insertOne(
        { _id: "initial-admin", createdAt: new Date() },
        { session }
      );
      await User.create(
        [{
          fullName: BOOTSTRAP_ADMIN_NAME.trim(),
          email,
          passwordHash: await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 12),
          role: "admin",
        }],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  console.info("Initial administrator created. Remove the bootstrap variables from the environment.");
}

try {
  await bootstrapAdmin();
} catch (error) {
  console.error(`Admin bootstrap failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
