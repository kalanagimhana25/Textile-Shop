import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

export default function Wishlist({
  products = [],
  favorites = [],
  onToggleFavorite,
  loading = false,
  error = "",
}) {
  const favoriteProducts = products.filter((product) =>
    favorites.some((id) => String(id) === String(product.id))
  );

  return (
    <main className="section shop-page">
      <p className="eyebrow">YOUR SAVED STYLES</p>
      <h1>Favorites</h1>
      {loading ? (
        <p className="muted" role="status">Loading your saved styles...</p>
      ) : error ? (
        <p className="catalog-message" role="alert">{error}</p>
      ) : favoriteProducts.length > 0 ? (
        <div className="product-grid">
          {favoriteProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="wishlist-empty">
          <p>You haven&apos;t saved any styles yet.</p>
          <Link to="/shop" className="primary-button">Explore the collection</Link>
        </div>
      )}
    </main>
  );
}
