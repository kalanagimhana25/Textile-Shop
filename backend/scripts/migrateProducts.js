import "dotenv/config";
import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import Category from "../models/Category.js";
import Department from "../models/Department.js";
import Product from "../models/Product.js";

function normalizeName(name) {
  return name.trim().toLowerCase();
}

async function loadFrontendProducts() {
  const productFile = fileURLToPath(new URL("../../src/data/product.js", import.meta.url));
  const source = await readFile(productFile, "utf8");
  const sourceUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  const { defaultProducts } = await import(sourceUrl);

  if (!Array.isArray(defaultProducts)) {
    throw new Error("The frontend product module does not export its normalized catalog.");
  }

  return defaultProducts;
}

async function getMigrationPlan(sourceProducts) {
  const departmentNames = [...new Set(sourceProducts.map((product) => product.category))];
  const categoryPairs = [
    ...new Map(
      sourceProducts.map((product) => [
        `${normalizeName(product.category)}:${normalizeName(product.type)}`,
        { departmentName: product.category, categoryName: product.type },
      ])
    ).values(),
  ];
  const migrationKeys = sourceProducts.map(
    (product) => `textile-shop-frontend-product:${product.id}`
  );
  const [existingProducts, existingDepartments] = await Promise.all([
    Product.find({ migrationKey: { $in: migrationKeys } }).select("+migrationKey").lean(),
    Department.find({
      normalizedName: { $in: departmentNames.map(normalizeName) },
    }).select("+normalizedName").lean(),
  ]);
  const departmentsByName = new Map(
    existingDepartments.map((department) => [department.normalizedName, department])
  );
  const existingCategories = await Category.find({
    department: { $in: existingDepartments.map((department) => department._id) },
    normalizedName: { $in: categoryPairs.map(({ categoryName }) => normalizeName(categoryName)) },
  }).select("+normalizedName").lean();
  const existingCategoryKeys = new Set(
    existingCategories.map(
      (category) => `${category.department.toString()}:${category.normalizedName}`
    )
  );

  const missingCategories = categoryPairs.filter(({ departmentName, categoryName }) => {
    const department = departmentsByName.get(normalizeName(departmentName));
    return !department ||
      !existingCategoryKeys.has(`${department._id.toString()}:${normalizeName(categoryName)}`);
  }).length;

  return {
    productsToInsert: sourceProducts.length - existingProducts.length,
    productsToUpdate: existingProducts.length,
    departmentsToCreate: departmentNames.filter(
      (name) => !departmentsByName.has(normalizeName(name))
    ).length,
    categoriesToCreate: missingCategories,
  };
}

async function migrateProducts() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const sourceProducts = await loadFrontendProducts();
  const plan = await getMigrationPlan(sourceProducts);
  console.info(
    `Migration plan: ${plan.productsToInsert} products to insert, ` +
    `${plan.productsToUpdate} migration-owned products to update, ` +
    `${plan.departmentsToCreate} departments and ${plan.categoriesToCreate} categories ` +
    "to create if missing. Other products will not be changed or deleted."
  );

  if (process.argv.includes("--dry-run")) {
    console.info("Dry run complete; no catalog records were changed.");
    return;
  }

  await Promise.all([Department.init(), Category.init(), Product.init()]);

  let inserted = 0;
  let updated = 0;

  for (const sourceProduct of sourceProducts) {
    const departmentName = sourceProduct.category;
    const categoryName = sourceProduct.type;
    const department = await Department.findOneAndUpdate(
      { normalizedName: normalizeName(departmentName) },
      {
        $setOnInsert: {
          name: departmentName,
          normalizedName: normalizeName(departmentName),
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
    const category = await Category.findOneAndUpdate(
      {
        department: department._id,
        normalizedName: normalizeName(categoryName),
      },
      {
        $setOnInsert: {
          name: categoryName,
          normalizedName: normalizeName(categoryName),
          department: department._id,
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );

    const migrationKey = `textile-shop-frontend-product:${sourceProduct.id}`;
    const existing = await Product.exists({ migrationKey });
    const colors = sourceProduct.colors.map((name) => ({
      name,
      image: sourceProduct.colorImages?.[name] || sourceProduct.image,
      stockBySize: sourceProduct.stockByColorSize[name],
    }));
    const images = [
      sourceProduct.image,
      ...Object.values(sourceProduct.colorImages || {}),
    ].filter(Boolean);

    const product = new Product({
      name: sourceProduct.name,
      description: sourceProduct.description,
      price: sourceProduct.price,
      image: sourceProduct.image,
      images: [...new Set(images)],
      category: category._id,
      department: department._id,
      sizes: sourceProduct.sizes,
      colors,
      material: sourceProduct.material,
      fit: sourceProduct.fit,
      migrationKey,
    });
    await product.validate();
    const productFields = product.toObject({ depopulate: true, flattenMaps: true });
    delete productFields._id;
    delete productFields.__v;
    delete productFields.migrationKey;
    await Product.findOneAndUpdate(
      { migrationKey },
      {
        $set: productFields,
        $setOnInsert: { migrationKey },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );

    if (existing) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  console.info(
    `Product migration complete: ${inserted} inserted, ${updated} updated. ` +
    "No products outside this migration's keys were changed or deleted."
  );
}

try {
  await migrateProducts();
} catch (error) {
  console.error("Product migration failed. Verify database connectivity and migration input.", {
    name: error.name,
    code: error.code,
  });
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
