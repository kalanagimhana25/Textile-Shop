import { Router } from "express";
import {
  createOrder,
  getAdminOrder,
  getAdminOrders,
  getCustomerOrder,
  getCustomerOrders,
  updateAdminOrderStatus,
} from "../controllers/orderController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { requireCustomer } from "../middleware/requireCustomer.js";

const orderRoutes = Router();

orderRoutes.use(authenticate);
orderRoutes.post("/", requireCustomer, createOrder);
orderRoutes.get("/mine", requireCustomer, getCustomerOrders);
orderRoutes.get("/mine/:id", requireCustomer, getCustomerOrder);
orderRoutes.get("/admin", requireAdmin, getAdminOrders);
orderRoutes.get("/admin/:id", requireAdmin, getAdminOrder);
orderRoutes.patch("/admin/:id/status", requireAdmin, updateAdminOrderStatus);

export default orderRoutes;
