import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const SHIPPING_COST = 250;
const MAX_ORDER_LINES = 50;
const MAX_LINE_QUANTITY = 99;
const orderStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
const allowedTransitions = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};
const productPopulation = [
  { path: "category", select: "name" },
  { path: "department", select: "name" },
];

function requestError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

function normalizeOrderRequest(body, idempotencyKey) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw requestError(400, "An order object is required.");
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_ORDER_LINES) {
    throw requestError(400, `An order must contain between 1 and ${MAX_ORDER_LINES} items.`);
  }
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey || "")) {
    throw requestError(400, "A valid Idempotency-Key header is required.");
  }

  const itemsByVariant = new Map();
  for (const item of body.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw requestError(400, "Each order item must be an object.");
    }

    const productId = typeof item.productId === "string" ? item.productId : "";
    const color = typeof item.color === "string" ? item.color.trim() : "";
    const size = typeof item.size === "string" ? item.size.trim() : "";
    const quantity = item.quantity;
    if (!validId(productId)) {
      throw requestError(400, "Each order item must include a valid product ID.");
    }
    if (!color || color.length > 60 || !size || size.length > 60 || /[.$\0]/.test(size)) {
      throw requestError(400, "Each order item must include a valid color and size.");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      throw requestError(400, `Item quantities must be whole numbers between 1 and ${MAX_LINE_QUANTITY}.`);
    }

    const variantKey = `${productId}:${color}:${size}`;
    const existing = itemsByVariant.get(variantKey);
    const combinedQuantity = quantity + (existing?.quantity || 0);
    if (combinedQuantity > MAX_LINE_QUANTITY) {
      throw requestError(400, `The quantity for ${color}, size ${size} cannot exceed ${MAX_LINE_QUANTITY}.`);
    }
    itemsByVariant.set(variantKey, { productId, color, size, quantity: combinedQuantity });
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phoneDigits = phone.replace(/\D/g, "");
  if (!/^[+()\d\s-]{7,24}$/.test(phone) || phoneDigits.length < 7) {
    throw requestError(400, "Enter a valid contact phone number.");
  }

  const address = body.deliveryAddress;
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    throw requestError(400, "A delivery address is required.");
  }
  const deliveryAddress = {
    line1: typeof address.line1 === "string" ? address.line1.trim() : "",
    line2: typeof address.line2 === "string" ? address.line2.trim() : "",
    city: typeof address.city === "string" ? address.city.trim() : "",
    region: typeof address.region === "string" ? address.region.trim() : "",
    postalCode: typeof address.postalCode === "string" ? address.postalCode.trim() : "",
    country: typeof address.country === "string" ? address.country.trim() : "",
  };
  if (
    !deliveryAddress.line1 ||
    deliveryAddress.line1.length > 200 ||
    deliveryAddress.line2.length > 200 ||
    !deliveryAddress.city ||
    deliveryAddress.city.length > 100 ||
    deliveryAddress.region.length > 100 ||
    deliveryAddress.postalCode.length > 24 ||
    !deliveryAddress.country ||
    deliveryAddress.country.length > 100
  ) {
    throw requestError(400, "Provide a valid street address, city, and country.");
  }

  return {
    idempotencyKey,
    phone,
    deliveryAddress,
    items: [...itemsByVariant.values()].sort((first, second) =>
      `${first.productId}:${first.color}:${first.size}`.localeCompare(
        `${second.productId}:${second.color}:${second.size}`
      )
    ),
  };
}

function assertSameOrderRequest(order, normalized) {
  const sameAddress = Object.keys(normalized.deliveryAddress).every(
    (key) => order.deliveryAddress[key] === normalized.deliveryAddress[key]
  );
  const storedItems = order.items.map((item) => ({
    productId: item.productId.toString(),
    color: item.color,
    size: item.size,
    quantity: item.quantity,
  })).sort((first, second) =>
    `${first.productId}:${first.color}:${first.size}`.localeCompare(
      `${second.productId}:${second.color}:${second.size}`
    )
  );
  const sameItems = JSON.stringify(storedItems) === JSON.stringify(normalized.items);

  if (order.customer.phone !== normalized.phone || !sameAddress || !sameItems) {
    throw requestError(409, "This Idempotency-Key has already been used for a different order.");
  }
}

function getStock(color, size) {
  const inventory = color.stockBySize;
  const value = inventory instanceof Map ? inventory.get(size) : inventory?.[size];
  return Number.isInteger(value) ? value : null;
}

async function getOrderProducts(items, session) {
  const productIds = [...new Set(items.map((item) => item.productId))];
  let query = Product.find({ _id: { $in: productIds } }).populate(productPopulation);
  if (session) query = query.session(session);
  const products = await query;
  const productById = new Map(products.map((product) => [product._id.toString(), product]));

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product) {
      throw requestError(404, "A product in your cart is no longer available.");
    }
    const color = product.colors.find((variant) => variant.name === item.color);
    if (!color || !product.sizes.includes(item.size)) {
      throw requestError(400, `${product.name} is not available in ${item.color}, size ${item.size}.`);
    }
    const stock = getStock(color, item.size);
    if (stock === null || stock < item.quantity) {
      throw requestError(
        409,
        `${product.name} has only ${Math.max(0, stock || 0)} ${item.color}, size ${item.size} item(s) in stock.`
      );
    }
  }

  return productById;
}

async function reserveStock(item, session) {
  const stockPath = `stockBySize.${item.size}`;
  const updatePath = `colors.$[variant].${stockPath}`;
  const options = { arrayFilters: [{ "variant.name": item.color }] };
  if (session) options.session = session;
  const result = await Product.updateOne(
    {
      _id: item.productId,
      colors: {
        $elemMatch: {
          name: item.color,
          [stockPath]: { $gte: item.quantity },
        },
      },
    },
    { $inc: { [updatePath]: -item.quantity } },
    options
  );
  if (result.matchedCount !== 1) {
    throw requestError(409, "Stock changed while placing your order. Refresh your cart and try again.");
  }
}

async function restoreReservations(reservedItems) {
  try {
    for (const item of [...reservedItems].reverse()) {
      const stockPath = `stockBySize.${item.size}`;
      const updatePath = `colors.$[variant].${stockPath}`;
      const result = await Product.updateOne(
        {
          _id: item.productId,
          colors: {
            $elemMatch: {
              name: item.color,
              [stockPath]: { $exists: true },
            },
          },
        },
        { $inc: { [updatePath]: item.quantity } },
        { arrayFilters: [{ "variant.name": item.color }] }
      );
      if (result.matchedCount !== 1) {
        throw new Error("A reserved product variant no longer exists.");
      }
    }
  } catch {
    console.error("Inventory rollback failed while processing an order.");
    throw requestError(500, "Order inventory recovery needs attention. Contact the store administrator.");
  }
}

function makeOrderDocument(normalized, user, productById) {
  let subtotal = 0;
  const items = normalized.items.map((item) => {
    const product = productById.get(item.productId);
    const itemSubtotal = Math.round(product.price * item.quantity * 100) / 100;
    subtotal += itemSubtotal;
    return {
      productId: product._id,
      productName: product.name,
      image: product.colors.find((variant) => variant.name === item.color)?.image || product.image,
      categoryName: product.category?.name || "",
      departmentName: product.department?.name || "",
      material: product.material,
      fit: product.fit,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal: itemSubtotal,
    };
  });
  subtotal = Math.round(subtotal * 100) / 100;
  const shippingCost = SHIPPING_COST;

  return new Order({
    orderNumber: `TS-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`,
    idempotencyKey: normalized.idempotencyKey,
    customer: {
      user: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: normalized.phone,
    },
    deliveryAddress: normalized.deliveryAddress,
    items,
    subtotal,
    shippingCost,
    total: Math.round((subtotal + shippingCost) * 100) / 100,
    status: "Pending",
  });
}

function isTransactionUnsupported(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === 20 ||
    error?.code === 303 ||
    message.includes("transaction numbers are only allowed") ||
    message.includes("transactions are not supported") ||
    message.includes("does not support transactions");
}

async function findExistingOrder(userId, normalized) {
  const existing = await Order.findOne({
    "customer.user": userId,
    idempotencyKey: normalized.idempotencyKey,
  });
  if (existing) assertSameOrderRequest(existing, normalized);
  return existing;
}

function getPagination(request) {
  const page = request.query.page === undefined ? 1 : Number(request.query.page);
  const limit = request.query.limit === undefined ? 20 : Number(request.query.limit);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw requestError(400, "Page must be a positive integer and limit must be between 1 and 100.");
  }
  return { page, limit };
}

async function sendOrderPage(response, filter, page, limit) {
  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  response.json({
    status: "success",
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

async function placeWithoutTransaction(normalized, user) {
  const existing = await findExistingOrder(user.id, normalized);
  if (existing) return { order: existing, duplicate: true };

  const productById = await getOrderProducts(normalized.items);
  const reservedItems = [];
  try {
    for (const item of normalized.items) {
      await reserveStock(item);
      reservedItems.push(item);
    }
    const order = makeOrderDocument(normalized, user, productById);
    await order.save();
    return { order, duplicate: false };
  } catch (error) {
    await restoreReservations(reservedItems);
    if (error.code === 11000) {
      const duplicate = await findExistingOrder(user.id, normalized);
      if (duplicate) return { order: duplicate, duplicate: true };
    }
    throw error;
  }
}

async function placeOrder(normalized, user) {
  const session = await mongoose.startSession();
  try {
    let result;
    try {
      await session.withTransaction(async () => {
        const existing = await Order.findOne({
          "customer.user": user.id,
          idempotencyKey: normalized.idempotencyKey,
        }).session(session);
        if (existing) {
          assertSameOrderRequest(existing, normalized);
          result = { order: existing, duplicate: true };
          return;
        }

        const productById = await getOrderProducts(normalized.items, session);
        for (const item of normalized.items) {
          await reserveStock(item, session);
        }
        const order = makeOrderDocument(normalized, user, productById);
        await order.save({ session });
        result = { order, duplicate: false };
      });
      return result;
    } catch (error) {
      if (isTransactionUnsupported(error)) {
        return await placeWithoutTransaction(normalized, user);
      }
      if (error.code === 11000) {
        const duplicate = await findExistingOrder(user.id, normalized);
        if (duplicate) return { order: duplicate, duplicate: true };
      }
      throw error;
    }
  } finally {
    await session.endSession();
  }
}

export async function createOrder(request, response) {
  const normalized = normalizeOrderRequest(request.body, request.get("Idempotency-Key"));
  await Order.init();
  const result = await placeOrder(normalized, request.user);
  response.status(result.duplicate ? 200 : 201).json({
    status: "success",
    data: { order: result.order, duplicate: result.duplicate },
  });
}

export async function getCustomerOrders(request, response) {
  const { page, limit } = getPagination(request);
  await sendOrderPage(response, { "customer.user": request.user.id }, page, limit);
}

export async function getCustomerOrder(request, response) {
  if (!validId(request.params.id)) {
    throw requestError(400, "Order ID must be a valid ID.");
  }
  const order = await Order.findOne({
    _id: request.params.id,
    "customer.user": request.user.id,
  });
  if (!order) throw requestError(404, "Order not found.");

  response.json({
    status: "success",
    data: { order },
  });
}

export async function getAdminOrders(request, response) {
  const { page, limit } = getPagination(request);
  await sendOrderPage(response, {}, page, limit);
}

export async function getAdminOrder(request, response) {
  if (!validId(request.params.id)) {
    throw requestError(400, "Order ID must be a valid ID.");
  }
  const order = await Order.findById(request.params.id);
  if (!order) throw requestError(404, "Order not found.");

  response.json({
    status: "success",
    data: { order },
  });
}

async function restoreOrderStock(order, session) {
  for (const item of order.items) {
    const stockPath = `stockBySize.${item.size}`;
    const updatePath = `colors.$[variant].${stockPath}`;
    const result = await Product.updateOne(
      {
        _id: item.productId,
        colors: {
          $elemMatch: {
            name: item.color,
            [stockPath]: { $exists: true },
          },
        },
      },
      { $inc: { [updatePath]: item.quantity } },
      { arrayFilters: [{ "variant.name": item.color }], session }
    );
    if (result.matchedCount !== 1) {
      throw requestError(409, "The order cannot be cancelled because its original stock variant is unavailable.");
    }
  }
}

export async function updateAdminOrderStatus(request, response) {
  if (!validId(request.params.id)) {
    throw requestError(400, "Order ID must be a valid ID.");
  }
  const nextStatus = request.body?.status;
  if (!orderStatuses.includes(nextStatus)) {
    throw requestError(400, "Choose a valid order status.");
  }

  if (nextStatus === "Cancelled") {
    const session = await mongoose.startSession();
    try {
      let updatedOrder;
      try {
        await session.withTransaction(async () => {
          const order = await Order.findById(request.params.id).session(session);
          if (!order) throw requestError(404, "Order not found.");
          if (order.status === "Cancelled") {
            updatedOrder = order;
            return;
          }
          if (!allowedTransitions[order.status]?.includes(nextStatus)) {
            throw requestError(409, `An order in ${order.status} status cannot be cancelled.`);
          }
          await restoreOrderStock(order, session);
          order.status = nextStatus;
          await order.save({ session });
          updatedOrder = order;
        });
      } catch (error) {
        if (isTransactionUnsupported(error)) {
          throw requestError(503, "Safe order cancellation requires MongoDB transaction support; no changes were made.");
        }
        throw error;
      }
      response.json({ status: "success", data: { order: updatedOrder } });
      return;
    } finally {
      await session.endSession();
    }
  }

  const order = await Order.findById(request.params.id);
  if (!order) throw requestError(404, "Order not found.");
  if (order.status === nextStatus) {
    response.json({ status: "success", data: { order } });
    return;
  }
  if (!allowedTransitions[order.status]?.includes(nextStatus)) {
    throw requestError(409, `An order in ${order.status} status cannot be changed to ${nextStatus}.`);
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: { status: nextStatus } },
    { new: true, runValidators: true }
  );
  if (!updatedOrder) {
    throw requestError(409, "The order status changed. Refresh and try again.");
  }

  response.json({ status: "success", data: { order: updatedOrder } });
}
