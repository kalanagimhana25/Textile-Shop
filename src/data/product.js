const catalogProducts = [
  {
    id: 1,
    name: "Everyday Oxford Shirt",
    category: "Men",
    type: "Shirts",
    price: 5900,
    stock: 24,
    stockBySize: { Small: 5, Medium: 10, Large: 9 },
    color: "Sky blue",
    colors: ["Sky blue", "White", "Navy"],
    colorImages: {
      "Sky blue": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900",
      White: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=900",
      Navy: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=900",
    },
    sizes: ["Small", "Medium", "Large"],
    material: "100% cotton",
    fit: "Regular fit",
    description: "A crisp, breathable Oxford shirt made for easy weekday dressing and relaxed weekends.",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900",
  },
  {
    id: 2,
    name: "Relaxed Linen Trousers",
    category: "Men",
    type: "Trousers",
    price: 7200,
    stock: 18,
    stockBySize: { Small: 4, Medium: 8, Large: 6 },
    color: "Sand",
    colors: ["Sand", "Charcoal", "Olive"],
    colorImages: {
      Sand: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900",
      Charcoal: "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=900",
      Olive: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=900",
    },
    sizes: ["Small", "Medium", "Large"],
    material: "Linen blend",
    fit: "Relaxed fit",
    description: "Lightweight, easy-moving trousers with a clean silhouette and a comfortable elasticated waist.",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900",
  },
  {
    id: 3,
    name: "Classic Crewneck Tee",
    category: "Men",
    type: "T-shirts",
    price: 3200,
    stock: 40,
    stockBySize: { Small: 12, Medium: 16, Large: 12 },
    color: "White",
    colors: ["White", "Black", "Forest green"],
    colorImages: {
      White: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900",
      Black: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900",
      "Forest green": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=900",
    },
    sizes: ["Small", "Medium", "Large"],
    material: "Soft cotton jersey",
    fit: "Classic fit",
    description: "An everyday essential in soft cotton jersey, finished with a neat crew neckline.",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900",
  },
  {
    id: 4,
    name: "Weekend Denim Jacket",
    category: "Men",
    type: "Jackets",
    price: 9800,
    stock: 12,
    stockBySize: { Small: 3, Medium: 5, Large: 4 },
    color: "Indigo",
    colors: ["Indigo", "Washed black"],
    colorImages: {
      Indigo: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=900",
      "Washed black": "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=900",
    },
    sizes: ["Small", "Medium", "Large"],
    material: "Cotton denim",
    fit: "Relaxed fit",
    description: "A timeless denim layer with practical pockets and just the right amount of structure.",
    image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=900",
  },
  {
    id: 5,
    name: "Soft Drape Midi Dress",
    category: "Women",
    type: "Dresses",
    price: 8400,
    stock: 16,
    stockBySize: { Small: 4, Medium: 7, Large: 5 },
    color: "Terracotta",
    colors: ["Terracotta", "Black", "Sage"],
    colorImages: {
      Terracotta: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=900",
      Black: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=900",
      Sage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900",
    },
    sizes: ["Small", "Medium", "Large"],
    material: "Viscose blend",
    fit: "Easy fit",
    description: "A beautifully fluid midi dress with a flattering waist and an effortless day-to-evening feel.",
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=900",
  },
  {
    id: 6,
    name: "Linen Blend Wide-Leg Pants",
    category: "Women",
    type: "Trousers",
    price: 6900,
    stock: 20,
    stockBySize: { Small: 5, Medium: 9, Large: 6 },
    color: "Natural",
    colors: ["Natural", "Black", "Dusty rose"],
    colorImages: {
      Natural: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900",
      Black: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=900",
      "Dusty rose": "https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=900",
    },
    sizes: ["Small", "Medium", "Large"],
    material: "Linen blend",
    fit: "Wide-leg fit",
    description: "Airy wide-leg trousers that pair beautifully with a simple tee or your favorite blouse.",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900",
  },
  {
    id: 7,
    name: "Everyday Ribbed Top",
    category: "Women",
    type: "Tops",
    price: 3600,
    stock: 32,
    stockBySize: { Small: 10, Medium: 12, Large: 10 },
    color: "Cream",
    colors: ["Cream", "Black", "Cocoa"],
    colorImages: {
      Cream: "https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=900",
      Black: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900",
      Cocoa: "https://images.unsplash.com/photo-1566206091558-7f218b696731?w=900",
    },
    sizes: ["Small", "Medium", "Large"],
    material: "Cotton rib",
    fit: "Slim fit",
    description: "A soft, stretchy ribbed top that feels just as good layered as it does on its own.",
    image: "https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=900",
  },
  {
    id: 8,
    name: "Pleated Midi Skirt",
    category: "Women",
    type: "Skirts",
    price: 6200,
    stock: 14,
    stockBySize: { Small: 3, Medium: 6, Large: 5 },
    color: "Olive",
    colors: ["Olive", "Black", "Sand"],
    colorImages: {
      Olive: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=900",
      Black: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=900",
      Sand: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900",
    },
    sizes: ["Small", "Medium", "Large"],
    material: "Lightweight woven",
    fit: "Flowing fit",
    description: "Soft pleats and a fluid shape make this midi skirt an easy favorite for every season.",
    image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=900",
  },
];

export const getVariantStock = (product, color, size) =>
  Number(
    product.stockByColorSize?.[color]?.[size] ??
      product.stockBySize?.[size] ??
      product.stock ??
      0
  );

export const normalizeProductInventory = (product) => {
  const colors = product.colors?.length
    ? product.colors
    : [product.color || "Default"];
  const sizes = product.sizes?.length
    ? product.sizes
    : ["Small", "Medium", "Large"];

  let stockByColorSize = product.stockByColorSize;

  if (!stockByColorSize) {
    stockByColorSize = Object.fromEntries(
      colors.map((color, colorIndex) => [
        color,
        Object.fromEntries(
          sizes.map((size) => {
            const sizeStock = Math.max(
              0,
              Number(
                product.stockBySize?.[size] ??
                  (Number(product.stock) || 0) / sizes.length
              )
            );
            const baseStock = Math.floor(sizeStock / colors.length);
            const remainder = Math.floor(sizeStock) % colors.length;
            return [size, baseStock + (colorIndex < remainder ? 1 : 0)];
          })
        ),
      ])
    );
  }

  const stockBySize = Object.fromEntries(
    sizes.map((size) => [
      size,
      colors.reduce(
        (total, color) =>
          total + Math.max(0, Number(stockByColorSize?.[color]?.[size]) || 0),
        0
      ),
    ])
  );

  return {
    ...product,
    colors,
    sizes,
    stockByColorSize,
    stockBySize,
    stock: Object.values(stockBySize).reduce((total, count) => total + count, 0),
  };
};

export const defaultProducts = catalogProducts.map(normalizeProductInventory);
export const products = defaultProducts;
