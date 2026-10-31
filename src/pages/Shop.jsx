import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const categories = ["All", "Men", "Women"];

export default function Shop({ products = [] }) {
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const category = categories.includes(searchParams.get("category"))
    ? searchParams.get("category")
    : "All";

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesSearch =
        !query ||
        [product.name, product.category, product.type, product.color]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [category, products, search]);

  const selectCategory = (nextCategory) => {
    if (nextCategory === "All") {
      setSearchParams({});
    } else {
      setSearchParams({ category: nextCategory });
    }
  };

  return (
    <main className="section shop-page">
      <div className="shop-intro">
        <p className="eyebrow">THE EVERYDAY COLLECTION</p>
        <h1>Find your new favorite.</h1>
        <p>Thoughtful staples and standout pieces for every day.</p>
      </div>

      <div className="shop-toolbar">
        <div className="category-tabs" aria-label="Shop by category">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "category-tab active" : "category-tab"}
              aria-pressed={category === item}
              onClick={() => selectCategory(item)}
            >
              {item === "All" ? "All clothing" : item === "Men" ? "Men's wear" : "Women's wear"}
            </button>
          ))}
        </div>

        <label className="search-field">
          <span className="visually-hidden">Search clothing</span>
          <input
            type="search"
            placeholder="Search styles..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      <div className="shop-results-heading">
        <h2>{category === "All" ? "All clothing" : `${category}'s wear`}</h2>
        <span>{filteredProducts.length} styles</span>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="empty-results">No matching styles. Try another search.</p>
      )}
    </main>
  );
}
