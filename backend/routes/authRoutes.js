import { Router } from "express";
import {
  getCurrentUser,
  login,
  register,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", authenticate, getCurrentUser);

export default authRoutes;
