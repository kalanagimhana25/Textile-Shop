import jwt from "jsonwebtoken";
import User from "../models/User.js";

function unauthorized(response) {
  response.status(401).json({
    status: "error",
    message: "Authentication is required.",
  });
}

export async function authenticate(request, response, next) {
  const authorization = request.get("authorization") || "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match) {
    unauthorized(response);
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    response.status(503).json({
      status: "error",
      message: "Authentication is not configured.",
    });
    return;
  }

  let claims;
  try {
    claims = jwt.verify(match[1], secret, {
      algorithms: ["HS256"],
    });
  } catch {
    unauthorized(response);
    return;
  }

  if (!claims || typeof claims !== "object" || typeof claims.sub !== "string") {
    unauthorized(response);
    return;
  }

  try {
    const user = await User.findById(claims.sub).select("fullName email role");
    if (!user) {
      unauthorized(response);
      return;
    }

    request.user = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}
