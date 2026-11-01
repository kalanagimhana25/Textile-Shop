import { Router } from "express";
import { getCategories } from "../controllers/categoryController.js";

const categoryRoutes = Router();

categoryRoutes.get("/", getCategories);

export default categoryRoutes;
