
import { useState } from "react";
import ProductCard from "../components/ProductCard";

const dressTypes = ["Skirt", "Pants", "Shirt"];
const fabricOptions = ["Cotton", "Linen", "Blends"];

const customOrderPrices = {
  Cotton: { Skirt: 2400, Pants: 3200, Shirt: 2200 },
  Linen: { Skirt: 2800, Pants: 3600, Shirt: 2600 },
  Blends: { Skirt: 2600, Pants: 3400, Shirt: 2400 },
};

export default function Shop({ onAddToCart, products = [] }) {
  const [search, setSearch] = useState("");
  const [fabric, setFabric] = useState("All");
  const [dressType, setDressType] = useState("All");
  const [customFabric, setCustomFabric] = useState("Cotton");
  const [customDressType, setCustomDressType] = useState("Skirt");

  const fabrics = ["All", ...new Set(products.map((product) => product.category))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.dressType.toLowerCase().includes(search.toLowerCase());

    const matchesFabric = fabric === "All" || product.category === fabric;
    const matchesDressType =
      dressType === "All" || product.dressType === dressType;

    return matchesSearch && matchesFabric && matchesDressType;
  });

  const selectedTitle =
    dressType === "All" ? "Ready to Wear" : `${dressType}s`;

  const customPrice = customOrderPrices[customFabric][customDressType];

  const handleCustomOrder = () => {
    if (!onAddToCart) return;

    onAddToCart({
      id: `custom-${customFabric}-${customDressType}`,
      name: `${customFabric} ${customDressType} - Custom Sew`,
      category: customFabric,
      dressType: customDressType,
      price: customPrice,
      stock: 1,
      color: "Custom",
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
    });
  };

  return (
    <main className="section">
      <p className="eyebrow">FIND YOUR PERFECT FABRIC</p>
      <h1>Our Collection</h1>

      <div className="shop-controls">
        <input
          type="search"
          placeholder="Search by fabric or dress type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={fabric} onChange={(e) => setFabric(e.target.value)}>
          {fabrics.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={dressType}
          onChange={(e) => setDressType(e.target.value)}
        >
          <option value="All">All dress types</option>
          {dressTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="custom-order-card">
        <div>
          <p className="eyebrow">CUSTOM SEWING</p>
          <h2>Choose the fabric and dress type you want sewn</h2>
        </div>

        <div className="custom-order-controls">
          <label>
            Fabric
            <select
              value={customFabric}
              onChange={(e) => setCustomFabric(e.target.value)}
            >
              {fabricOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Dress type
            <select
              value={customDressType}
              onChange={(e) => setCustomDressType(e.target.value)}
            >
              {dressTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="custom-order-footer">
          <strong>Estimated sewing price: Rs. {customPrice.toLocaleString()}</strong>
          <button
            type="button"
            className="primary-button"
            onClick={handleCustomOrder}
          >
            Add custom sewing request
          </button>
        </div>
      </div>

      <div className="shop-banner">
        <div>
          <p className="eyebrow">READY TO WEAR</p>
          <h2>{selectedTitle}</h2>
        </div>
        <p>
          Choose your preferred fabric and dress type, then buy a finished piece
          directly from the collection.
        </p>
      </div>

      <div className="product-grid">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p>No matching dress styles found. Try another fabric or dress type.</p>
      )}
    </main>
  );
}
