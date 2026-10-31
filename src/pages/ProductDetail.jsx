import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { getVariantStock } from "../data/product";

const sizes = ["Small", "Medium", "Large"];
const colorSwatches = {
  black: "#282725",
  white: "#f7f5ef",
  cream: "#e8dfce",
  cocoa: "#725443",
  "sky blue": "#9bbbd0",
  navy: "#293851",
  sand: "#c5ad8a",
  charcoal: "#555452",
  olive: "#777956",
  "forest green": "#365748",
  indigo: "#455879",
  "washed black": "#595958",
  terracotta: "#b76f58",
  sage: "#a9b39a",
  natural: "#ded3bd",
  "dusty rose": "#c89892",
};

export default function ProductDetail({ products = [], cart = [], onAddToCart }) {
  const { productId } = useParams();
  const product = products.find((item) => String(item.id) === productId);

  if (!product) {
    return (
      <main className="section">
        <p className="eyebrow">STYLE NOT FOUND</p>
        <h1>We couldn't find that piece.</h1>
        <Link to="/shop" className="primary-button">Back to the collection</Link>
      </main>
    );
  }

  return (
    <ProductDetailView
      key={productId}
      product={product}
      products={products}
      cart={cart}
      onAddToCart={onAddToCart}
    />
  );
}

function ProductDetailView({ product, products, cart, onAddToCart }) {
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [added, setAdded] = useState(false);
  const selectedSizeStock = selectedColor && selectedSize
    ? getVariantStock(product, selectedColor, selectedSize)
    : null;
  const selectedVariantQuantity = cart
    .filter((item) => item.id === product.id && item.color === selectedColor && item.size === selectedSize)
    .reduce((total, item) => total + item.quantity, 0);

  const colors = product.colors?.length ? product.colors : [product.color || "Default"];
  const availableSizes = product.sizes?.length ? product.sizes : sizes;
  const selectedImage = (selectedColor && product.colorImages?.[selectedColor]) || product.image;
  const relatedProducts = products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize || selectedSizeStock < 1 || selectedVariantQuantity >= selectedSizeStock) return;
    onAddToCart?.({
      ...product,
      color: selectedColor,
      size: selectedSize,
      image: selectedImage,
      variantStock: selectedSizeStock,
    });
    setAdded(true);
  };

  return (
    <main>
      <div className="detail-breadcrumb">
        <Link to="/shop"><ArrowLeft size={16} /> Back to shop</Link>
        <span>{product.category} / {product.type}</span>
      </div>

      <section className="product-detail">
        <div className="detail-image-wrap">
          <img src={selectedImage} alt={`${product.name}${selectedColor ? ` in ${selectedColor}` : ""}`} className="detail-image" />
        </div>

        <div className="detail-info">
          <p className="eyebrow">{product.category === "Men" ? "MEN'S WEAR" : "WOMEN'S WEAR"} · {product.type}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">Rs. {Number(product.price).toLocaleString()}</p>
          <p className="detail-description">{product.description || "A thoughtfully designed everyday favorite, made for comfort and easy styling."}</p>

          <div className="variant-group">
            <div className="variant-label">
              <span>Color</span>
              {selectedColor && <strong>{selectedColor}</strong>}
            </div>
            <div className="color-options">
              {colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  className={selectedColor === color ? "color-option selected" : "color-option"}
                  style={{ "--swatch-color": colorSwatches[color.toLowerCase()] || "#c9c1b4" }}
                  aria-label={`Select ${color}`}
                  aria-pressed={selectedColor === color}
                  onClick={() => {
                    setSelectedColor(color);
                    setAdded(false);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="variant-group">
            <div className="variant-label">
              <span>Size</span>
              <span className="size-guide">Small · Medium · Large</span>
            </div>
            <div className="size-options">
              {availableSizes.map((size) => {
                const stock = selectedColor ? getVariantStock(product, selectedColor, size) : null;
                return (
                  <button
                    type="button"
                    key={size}
                    className={[
                      "size-option",
                      selectedSize === size ? "selected" : "",
                      stock !== null && stock < 1 ? "out-of-stock" : "",
                    ].filter(Boolean).join(" ")}
                    aria-pressed={selectedSize === size}
                    aria-label={`${size}, ${!selectedColor ? "select a color first" : stock > 0 ? `${stock} in stock` : "out of stock"}`}
                    disabled={!selectedColor || stock < 1}
                    onClick={() => {
                      setSelectedSize(size);
                      setAdded(false);
                    }}
                  >
                    <span>{size}</span>
                    <small>{!selectedColor ? "Choose color" : stock > 0 ? `${stock} in stock` : "Sold out"}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="primary-button add-to-cart-button"
            disabled={!selectedColor || !selectedSize || selectedSizeStock < 1 || selectedVariantQuantity >= selectedSizeStock}
            onClick={handleAddToCart}
          >
            <ShoppingBag size={18} />
            {selectedVariantQuantity >= selectedSizeStock && selectedSizeStock > 0
              ? "Maximum quantity in bag"
              : added
                ? "Added to your bag"
                : "Add to bag"}
          </button>
          {selectedColor && selectedSize && selectedSizeStock < 1 ? (
            <p className="stock-note sold-out">This size is currently out of stock</p>
          ) : selectedColor && selectedSize ? (
            <p className="stock-note">
              {Math.max(0, selectedSizeStock - selectedVariantQuantity)} left in {selectedSize}
            </p>
          ) : (
            <p className="stock-note">Select a size to see availability</p>
          )}

          <div className="product-specs">
            <div><span>Material</span><strong>{product.material || "Quality everyday material"}</strong></div>
            <div><span>Fit</span><strong>{product.fit || "Designed for everyday comfort"}</strong></div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="section related-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A FEW MORE GOOD ONES</p>
              <h2>More to love</h2>
            </div>
            <Link to={`/shop?category=${product.category}`} className="text-link">Shop {product.category.toLowerCase()}'s wear</Link>
          </div>
          <div className="product-grid">
            {relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </main>
  );
}
