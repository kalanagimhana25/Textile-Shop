import { ArrowUpRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { getProductSizes } from "../data/product";

export default function ProductCard({
  product,
  favorites = [],
  onToggleFavorite,
}) {
  const isFavorite = favorites.some((id) => String(id) === String(product.id));

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link
          to={`/product/${product.id}`}
          className="product-image-link"
          aria-label={`View ${product.name}`}
        >
          <img src={product.image} alt={product.name} />
          <span className="product-category-tag">
            {product.category === "Men" ? "MEN" : "WOMEN"}
          </span>
        </Link>
        <button
          type="button"
          className={isFavorite ? "favorite-button active" : "favorite-button"}
          aria-label={`${isFavorite ? "Remove from" : "Add to"} favorites: ${product.name}`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite?.(product.id)}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="product-info">
        <p className="category">{product.type}</p>
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-color">
          {product.colors?.length || 1} colors <span aria-hidden="true">·</span>{" "}
          Sizes {product.sizes?.join(", ") || getProductSizes(product.type).join(", ")}
        </p>

        <div className="product-bottom">
          <strong>Rs. {Number(product.price).toLocaleString()}</strong>
          <Link
            to={`/product/${product.id}`}
            className="icon-button"
            aria-label={`Choose options for ${product.name}`}
          >
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
