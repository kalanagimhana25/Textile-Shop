import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingBag, X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { getProductSizes, getVariantStock } from "../data/product";
import { getColorSwatch } from "../data/color";
import { apiRequest, getApiErrorMessage } from "../services/api";
import { mapApiProduct } from "../services/catalog";

export default function ProductDetail({
  products = [],
  cart = [],
  favorites = [],
  onToggleFavorite,
  onAddToCart,
}) {
  const { productId } = useParams();
  const [detailState, setDetailState] = useState(null);

  useEffect(() => {
    let active = true;
    apiRequest(`/products/${encodeURIComponent(productId)}`)
      .then((response) => {
        const product = mapApiProduct(response.data.product);
        if (active) setDetailState({ id: productId, loading: false, product, error: "" });
      })
      .catch((error) => {
        if (active) {
          setDetailState({
            id: productId,
            loading: false,
            product: null,
            error: getApiErrorMessage(error),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [productId]);

  const currentDetail = detailState?.id === productId ? detailState : null;
  if (!currentDetail || currentDetail.loading) {
    return <main className="section"><p className="muted" role="status">Loading product...</p></main>;
  }

  if (currentDetail.error) {
    return (
      <main className="section">
        <p className="eyebrow">PRODUCT UNAVAILABLE</p>
        <h1>We couldn't load this piece.</h1>
        <p className="catalog-message" role="alert">{currentDetail.error}</p>
        <Link to="/shop" className="primary-button">Back to the collection</Link>
      </main>
    );
  }

  const product = currentDetail.product;
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
      favorites={favorites}
      onToggleFavorite={onToggleFavorite}
      onAddToCart={onAddToCart}
    />
  );
}

function ProductDetailView({
  product,
  products,
  cart,
  favorites,
  onToggleFavorite,
  onAddToCart,
}) {
  const [selectedColor, setSelectedColor] = useState(
    product.colors?.[0] || product.color || ""
  );
  const [selectedSize, setSelectedSize] = useState("");
  const [added, setAdded] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const isFavorite = favorites.some((id) => String(id) === String(product.id));
  const selectedSizeStock = selectedColor && selectedSize
    ? getVariantStock(product, selectedColor, selectedSize)
    : null;
  const selectedVariantQuantity = cart
    .filter((item) => item.id === product.id && item.color === selectedColor && item.size === selectedSize)
    .reduce((total, item) => total + item.quantity, 0);

  const colors = product.colors?.length ? product.colors : [product.color || "Default"];
  const availableSizes = product.sizes?.length ? product.sizes : getProductSizes(product.type);
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
          <button
            type="button"
            className={isFavorite ? "favorite-detail-button active" : "favorite-detail-button"}
            aria-pressed={isFavorite}
            onClick={() => onToggleFavorite?.(product.id)}
          >
            <Heart size={17} fill={isFavorite ? "currentColor" : "none"} />
            {isFavorite ? "Saved to favorites" : "Save to favorites"}
          </button>

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
                  style={{ "--swatch-color": product.colorSwatches?.[color] || getColorSwatch(color) }}
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
              <button
                type="button"
                className="size-guide-link"
                onClick={() => setShowSizeGuide(true)}
              >
                Size guide
              </button>
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

      {showSizeGuide && (
        <div
          className="size-guide-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowSizeGuide(false);
          }}
        >
          <section
            className="size-guide-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
          >
            <div className="size-guide-heading">
              <div>
                <p className="eyebrow">FIND YOUR FIT</p>
                <h2 id="size-guide-title">Size guide</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close size guide"
                onClick={() => setShowSizeGuide(false)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="muted">
              {availableSizes.every((size) => /^\d+$/.test(size))
                ? "Pants and trousers use waist measurements in inches."
                : "Choose the size you normally wear. Fit may vary by style."}
            </p>
            {availableSizes.every((size) => /^\d+$/.test(size)) ? (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Label</th><th>Waist (inches)</th></tr></thead>
                  <tbody>
                    {availableSizes.map((size) => (
                      <tr key={size}><td>Size {size}</td><td>{size}&quot;</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Label</th><th>General fit</th></tr></thead>
                  <tbody>
                    {availableSizes.map((size) => (
                      <tr key={size}>
                        <td>{size}</td>
                        <td>{size === "Small" ? "Smaller fit" : size === "Medium" ? "Regular fit" : "Roomier fit"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

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
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
