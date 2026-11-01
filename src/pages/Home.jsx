import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "../components/ProductCard";

export default function Home({ products = [], favorites = [], onToggleFavorite }) {
  const featuredProducts = [
    ...products.filter((product) => product.category === "Men").slice(0, 2),
    ...products.filter((product) => product.category === "Women").slice(0, 2),
  ];

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">A LITTLE MORE YOU, EVERY DAY</p>
          <h1>
            Good clothes.
            <br />
            <span>Good days.</span>
          </h1>
          <p className="hero-description">
            Easy-to-love pieces, made for wherever the day takes you.
          </p>
          <Link to="/shop" className="primary-button">
            Shop the collection <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="section category-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR FIT</p>
            <h2>Made for your kind of day.</h2>
          </div>
        </div>
        <div className="category-feature-grid">
          <Link to="/shop?category=Men" className="category-feature men-feature">
            <span>THE MEN'S EDIT</span>
            <strong>Everyday, elevated.</strong>
            <span className="category-feature-link">Shop men <ArrowRight size={16} /></span>
          </Link>
          <Link to="/shop?category=Women" className="category-feature women-feature">
            <span>THE WOMEN'S EDIT</span>
            <strong>Wear your way.</strong>
            <span className="category-feature-link">Shop women <ArrowRight size={16} /></span>
          </Link>
        </div>
      </section>

      <section className="section featured-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE GOOD STUFF</p>
            <h2>Customer favorites</h2>
          </div>
          <Link to="/shop" className="text-link">
            View all styles <ArrowRight size={16} />
          </Link>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
