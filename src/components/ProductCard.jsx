import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
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

      <div className="product-info">
        <p className="category">{product.type}</p>
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-color">
          {product.colors?.length || 1} colors <span aria-hidden="true">·</span>{" "}
          Small, Medium & Large
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
