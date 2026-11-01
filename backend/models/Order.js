import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    image: {
      type: String,
      default: "",
      maxlength: 2048,
    },
    categoryName: {
      type: String,
      default: "",
      maxlength: 80,
    },
    departmentName: {
      type: String,
      default: "",
      maxlength: 80,
    },
    material: {
      type: String,
      default: "",
      maxlength: 120,
    },
    fit: {
      type: String,
      default: "",
      maxlength: 120,
    },
    color: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    size: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
      validate: Number.isInteger,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      maxlength: 40,
    },
    idempotencyKey: {
      type: String,
      required: true,
      maxlength: 128,
      immutable: true,
    },
    customer: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        immutable: true,
      },
      fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 254,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 24,
      },
    },
    deliveryAddress: {
      line1: { type: String, required: true, trim: true, maxlength: 200 },
      line2: { type: String, trim: true, maxlength: 200, default: "" },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      region: { type: String, trim: true, maxlength: 100, default: "" },
      postalCode: { type: String, trim: true, maxlength: 24, default: "" },
      country: { type: String, required: true, trim: true, maxlength: 100 },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item.",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingCost: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
      required: true,
    },
  },
  { timestamps: true }
);

orderSchema.index(
  { "customer.user": 1, idempotencyKey: 1 },
  { unique: true }
);
orderSchema.index({ "customer.user": 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
