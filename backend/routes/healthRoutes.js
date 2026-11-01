import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";

const healthRoutes = Router();

healthRoutes.get("/", getHealth);

export default healthRoutes;
