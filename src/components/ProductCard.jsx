
import { ShoppingBag } from "lucide-react";

export default function ProductCard({ product, onAddToCart }) {
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <article className="product-card">
      <img src={product.image} alt={product.name} />

      <div className="product-info">
        <p className="category">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="product-color">Color: {product.color}</p>

        <div className="product-bottom">
          <strong>Rs. {product.price.toLocaleString()}</strong>

          <button
            type="button"
            className="icon-button"
            aria-label={`Add ${product.name} to cart`}
            onClick={handleAddToCart}
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
