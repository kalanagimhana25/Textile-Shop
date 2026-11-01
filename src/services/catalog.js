export function mapApiProduct(product) {
  const colors = (product.colors || []).map((color) => color.name);
  const stockByColorSize = Object.fromEntries(
    (product.colors || []).map((color) => [
      color.name,
      { ...(color.stockBySize || {}) },
    ])
  );
  const stockBySize = Object.fromEntries(
    (product.sizes || []).map((size) => [
      size,
      colors.reduce(
        (total, color) => total + Number(stockByColorSize[color]?.[size] || 0),
        0
      ),
    ])
  );
  const colorImages = Object.fromEntries(
    (product.colors || []).map((color) => [color.name, color.image || product.image])
  );
  const department = typeof product.department === "object"
    ? product.department
    : null;
  const category = typeof product.category === "object"
    ? product.category
    : null;

  return {
    id: String(product._id),
    name: product.name,
    description: product.description,
    price: Number(product.price),
    image: product.image,
    images: product.images || [],
    category: department?.name || "",
    categoryId: department?._id || product.department,
    type: category?.name || "",
    typeId: category?._id || product.category,
    colors,
    color: colors[0] || "",
    colorImages,
    colorSwatches: {},
    sizes: product.sizes || [],
    stockByColorSize,
    stockBySize,
    stock: Object.values(stockBySize).reduce((total, count) => total + count, 0),
    material: product.material || "",
    fit: product.fit || "",
  };
}

export function toApiProduct(product, categories, departments) {
  const department = departments.find(
    (item) => item.name.toLowerCase() === String(product.category).toLowerCase()
  );
  const category = categories.find(
    (item) =>
      item.name.toLowerCase() === String(product.type).toLowerCase() &&
      String(item.department?._id) === String(department?._id)
  );

  if (!department) {
    throw new Error("Choose a department loaded from the store database.");
  }
  if (!category) {
    throw new Error(
      `The "${product.type}" category is not available in ${department.name}. Categories can only be selected from the database in this phase.`
    );
  }

  const colors = (product.colors || []).map((name) => ({
    name,
    image: product.colorImages?.[name] || product.image,
    stockBySize: Object.fromEntries(
      (product.sizes || []).map((size) => [
        size,
        Math.max(0, Math.floor(Number(product.stockByColorSize?.[name]?.[size]) || 0)),
      ])
    ),
  }));
  const imageUrls = [product.image, ...colors.map((color) => color.image)];
  if (imageUrls.some((image) => {
    if (typeof image !== "string" || image.length > 2048) return true;
    try {
      return !["http:", "https:"].includes(new URL(image).protocol);
    } catch {
      return true;
    }
  })) {
    throw new Error("Use a valid hosted HTTP or HTTPS image URL (maximum 2048 characters).");
  }

  return {
    name: product.name,
    description: product.description,
    price: Number(product.price),
    image: product.image,
    images: [...new Set([product.image, ...colors.map((color) => color.image)].filter(Boolean))],
    category: category._id,
    department: department._id,
    sizes: product.sizes,
    colors,
    material: product.material,
    fit: product.fit,
  };
}
