import mongoose from "mongoose";

const colorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    image: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2048,
    },
    stockBySize: {
      type: Map,
      of: {
        type: Number,
        min: 0,
        validate: {
          validator: Number.isInteger,
          message: "Stock quantities must be whole numbers.",
        },
      },
      required: true,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: "Price must be a finite number.",
      },
    },
    image: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (images) => images.length > 0,
        message: "At least one product image is required.",
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    sizes: {
      type: [{ type: String, trim: true, required: true }],
      required: true,
      validate: [
        {
          validator: (sizes) => sizes.length > 0,
          message: "At least one size is required.",
        },
        {
          validator: (sizes) => new Set(sizes.map((size) => size.toLowerCase())).size === sizes.length,
          message: "Product sizes must be unique.",
        },
      ],
    },
    colors: {
      type: [colorSchema],
      required: true,
      validate: [
        {
          validator: (colors) => colors.length > 0,
          message: "At least one color is required.",
        },
        {
          validator: (colors) => new Set(colors.map((color) => color.name.toLowerCase())).size === colors.length,
          message: "Product colors must be unique.",
        },
      ],
    },
    material: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    fit: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    migrationKey: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

productSchema.index(
  { migrationKey: 1 },
  { unique: true, sparse: true }
);

productSchema.pre("validate", function validateColorInventory() {
  const expectedSizes = new Set(this.sizes || []);

  for (const color of this.colors || []) {
    const inventory = color.stockBySize;
    const stockSizes = inventory instanceof Map
      ? [...inventory.keys()]
      : Object.keys(inventory || {});

    if (
      stockSizes.length !== expectedSizes.size ||
      stockSizes.some((size) => !expectedSizes.has(size))
    ) {
      color.invalidate(
        "stockBySize",
        "Each color must have exactly one stock quantity for every product size."
      );
    }
  }
});

export default mongoose.model("Product", productSchema);
