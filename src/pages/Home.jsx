
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "../components/ProductCard";

export default function Home({ onAddToCart, products = [] }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">QUALITY FABRICS. TIMELESS STYLE.</p>

          <h1>
            The beauty of
            <br />
            <span>beautiful textiles.</span>
          </h1>

          <p className="hero-description">
            Discover quality fabrics for every creation, crafted for comfort and
            style.
          </p>

          <Link to="/shop" className="primary-button">
            Explore Collection
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OUR COLLECTION</p>
            <h2>Featured Fabrics</h2>
          </div>

          <Link to="/shop" className="text-link">
            View all products →
          </Link>
        </div>

        <div className="product-grid">
          {products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
