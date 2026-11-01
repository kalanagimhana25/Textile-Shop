import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { validatePassword } from "../utils/passwordValidation.js";

const bcryptRounds = 12;

function requestError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getJwtConfiguration() {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw requestError(503, "Authentication is not configured.");
  }

  return { secret, expiresIn };
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function safeUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

function issueToken(user) {
  const { secret, expiresIn } = getJwtConfiguration();
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    secret,
    { algorithm: "HS256", expiresIn }
  );
}

export async function register(request, response) {
  const { fullName, email, password, confirmPassword } = request.body || {};
  const normalizedEmail = normalizeEmail(email);

  if (typeof fullName !== "string" || fullName.trim().length < 2 || fullName.trim().length > 120) {
    throw requestError(400, "Full name must be between 2 and 120 characters.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    throw requestError(400, "A valid email address is required.");
  }
  if (!validatePassword(password)) {
    throw requestError(400, "Password must be 10–72 UTF-8 bytes and include lowercase, uppercase, and numeric characters.");
  }
  if (confirmPassword !== undefined && confirmPassword !== password) {
    throw requestError(400, "Password confirmation does not match.");
  }

  if (await User.exists({ email: normalizedEmail })) {
    throw requestError(409, "An account with this email already exists.");
  }

  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, bcryptRounds),
    role: "customer",
  });

  response.status(201).json({
    status: "success",
    data: { user: safeUser(user) },
  });
}

export async function login(request, response) {
  const { email, password } = request.body || {};
  const normalizedEmail = normalizeEmail(email);

  if (
    !normalizedEmail ||
    typeof password !== "string" ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw requestError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user || !(await user.verifyPassword(password))) {
    throw requestError(401, "Invalid email or password.");
  }

  response.json({
    status: "success",
    data: {
      token: issueToken(user),
      user: safeUser(user),
    },
  });
}

export function getCurrentUser(request, response) {
  response.json({
    status: "success",
    data: { user: request.user },
  });
}
