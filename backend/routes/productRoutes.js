import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/productController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const productRoutes = Router();

productRoutes.get("/", getProducts);
productRoutes.get("/:id", getProductById);
productRoutes.post("/", authenticate, requireAdmin, createProduct);
productRoutes.put("/:id", authenticate, requireAdmin, updateProduct);
productRoutes.delete("/:id", authenticate, requireAdmin, deleteProduct);

export default productRoutes;
