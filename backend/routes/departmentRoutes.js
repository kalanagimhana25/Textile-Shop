import { Router } from "express";
import { getDepartments } from "../controllers/departmentController.js";

const departmentRoutes = Router();

departmentRoutes.get("/", getDepartments);

export default departmentRoutes;
