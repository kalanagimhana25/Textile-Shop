import mongoose from "mongoose";
import Category from "../models/Category.js";
import Department from "../models/Department.js";
import Product from "../models/Product.js";

function requestError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function requireObjectId(value, fieldName) {
  if (!mongoose.isValidObjectId(value)) {
    throw requestError(400, `${fieldName} must be a valid ID.`);
  }
}

function validateProductBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw requestError(400, "A product object is required.");
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    throw requestError(400, "Product name is required.");
  }
  if (typeof body.description !== "string") {
    throw requestError(400, "Product description is required.");
  }
  if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0) {
    throw requestError(400, "Product price must be a non-negative number.");
  }
  if (!Array.isArray(body.sizes) || body.sizes.length === 0) {
    throw requestError(400, "At least one product size is required.");
  }
  if (
    body.sizes.some((size) => typeof size !== "string" || !size.trim()) ||
    new Set(body.sizes.map((size) => size.trim().toLowerCase())).size !== body.sizes.length
  ) {
    throw requestError(400, "Product sizes must be non-empty, unique strings.");
  }
  if (!Array.isArray(body.colors) || body.colors.length === 0) {
    throw requestError(400, "At least one product color is required.");
  }
  const colorNames = [];
  for (const color of body.colors) {
    if (
      !color ||
      typeof color !== "object" ||
      Array.isArray(color) ||
      typeof color.name !== "string" ||
      !color.name.trim() ||
      (color.image !== undefined && typeof color.image !== "string") ||
      !color.stockBySize ||
      typeof color.stockBySize !== "object" ||
      Array.isArray(color.stockBySize)
    ) {
      throw requestError(400, "Each color must include a name and a stockBySize object.");
    }

    colorNames.push(color.name.trim().toLowerCase());
    const stockSizes = Object.keys(color.stockBySize);
    if (
      stockSizes.length !== body.sizes.length ||
      body.sizes.some((size) => !Object.hasOwn(color.stockBySize, size)) ||
      Object.values(color.stockBySize).some(
        (quantity) => !Number.isInteger(quantity) || quantity < 0
      )
    ) {
      throw requestError(400, "Each color needs a non-negative whole-number stock value for every size.");
    }
  }
  if (new Set(colorNames).size !== colorNames.length) {
    throw requestError(400, "Product colors must be unique.");
  }

  if (body.image !== undefined && typeof body.image !== "string") {
    throw requestError(400, "Product image must be a string.");
  }
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const images = Array.isArray(body.images) ? body.images : [];
  if (
    body.images !== undefined &&
    (!Array.isArray(body.images) || body.images.some((item) => typeof item !== "string" || !item.trim()))
  ) {
    throw requestError(400, "Product images must be non-empty strings.");
  }
  if (!image && !images.some((item) => typeof item === "string" && item.trim())) {
    throw requestError(400, "At least one product image is required.");
  }
  if (
    (body.material !== undefined && typeof body.material !== "string") ||
    (body.fit !== undefined && typeof body.fit !== "string")
  ) {
    throw requestError(400, "Product material and fit must be strings.");
  }

  requireObjectId(body.category, "Category");
  requireObjectId(body.department, "Department");
}

async function getProductFields(body) {
  validateProductBody(body);

  const [category, department] = await Promise.all([
    Category.findById(body.category),
    Department.findById(body.department),
  ]);

  if (!category || !department) {
    throw requestError(400, "The selected category or department does not exist.");
  }
  if (category.department.toString() !== department._id.toString()) {
    throw requestError(400, "The category does not belong to the selected department.");
  }

  const image = typeof body.image === "string" && body.image.trim()
    ? body.image.trim()
    : (body.images || []).find((item) => typeof item === "string" && item.trim()).trim();
  const images = Array.isArray(body.images)
    ? body.images.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
    : [];
  if (!images.includes(image)) {
    images.unshift(image);
  }

  return {
    name: body.name,
    description: body.description,
    price: body.price,
    image,
    images: [...new Set(images)],
    category: category._id,
    department: department._id,
    sizes: body.sizes,
    colors: body.colors,
    material: body.material,
    fit: body.fit,
  };
}

const productPopulation = [
  { path: "category", select: "name description department" },
  { path: "department", select: "name description" },
];

export async function getProducts(_request, response) {
  const products = await Product.find()
    .populate(productPopulation)
    .sort({ createdAt: -1 });

  response.json({
    status: "success",
    data: { products },
  });
}

export async function getProductById(request, response) {
  requireObjectId(request.params.id, "Product ID");

  const product = await Product.findById(request.params.id).populate(productPopulation);
  if (!product) {
    throw requestError(404, "Product not found.");
  }

  response.json({
    status: "success",
    data: { product },
  });
}

export async function createProduct(request, response) {
  const fields = await getProductFields(request.body);
  const product = await Product.create(fields);
  await product.populate(productPopulation);

  response.status(201).json({
    status: "success",
    data: { product },
  });
}

export async function updateProduct(request, response) {
  requireObjectId(request.params.id, "Product ID");
  const product = await Product.findById(request.params.id);
  if (!product) {
    throw requestError(404, "Product not found.");
  }

  product.set(await getProductFields(request.body));
  await product.save();
  await product.populate(productPopulation);

  response.json({
    status: "success",
    data: { product },
  });
}

export async function deleteProduct(request, response) {
  requireObjectId(request.params.id, "Product ID");
  const product = await Product.findByIdAndDelete(request.params.id);
  if (!product) {
    throw requestError(404, "Product not found.");
  }

  response.json({
    status: "success",
    data: { id: product._id },
  });
}
