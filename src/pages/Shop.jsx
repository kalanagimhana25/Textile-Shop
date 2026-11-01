import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { getProductSizes, getVariantStock } from "../data/product";

export default function Shop({
  products = [],
  categories = [],
  departments = [],
  favorites = [],
  onToggleFavorite,
  loading = false,
  error = "",
  onRetry,
}) {
  const departmentNames = departments.map((department) => department.name);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const category = ["All", ...departmentNames].includes(searchParams.get("category"))
    ? searchParams.get("category")
    : "All";
  const selectedType = searchParams.get("type") || "All";
  const types = [...new Set(categories.map((item) => item.name?.trim()).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesType = selectedType === "All" || product.type?.toLowerCase() === selectedType.toLowerCase();
      const matchesPrice = maxPrice === "all" || Number(product.price) <= Number(maxPrice);
      const hasStock = (product.colors || [product.color || "Default"]).some((color) =>
        (product.sizes || getProductSizes(product.type))
          .some((size) => getVariantStock(product, color, size) > 0)
      );
      const matchesSearch =
        !query ||
        [product.name, product.category, product.type, product.color]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      return matchesCategory && matchesType && matchesSearch &&
        matchesPrice && (!inStockOnly || hasStock);
    });

    return filtered.sort((first, second) => {
      if (sortOrder === "price-low") return Number(first.price) - Number(second.price);
      if (sortOrder === "price-high") return Number(second.price) - Number(first.price);
      if (sortOrder === "name") return first.name.localeCompare(second.name);
      return 0;
    });
  }, [category, inStockOnly, maxPrice, products, search, selectedType, sortOrder]);

  const selectCategory = (nextCategory) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextCategory === "All") nextParams.delete("category");
    else nextParams.set("category", nextCategory);
    setSearchParams(nextParams);
  };

  const selectType = (nextType) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextType === "All") nextParams.delete("type");
    else nextParams.set("type", nextType);
    setSearchParams(nextParams);
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
          {["All", ...departmentNames].map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "category-tab active" : "category-tab"}
              aria-pressed={category === item}
              onClick={() => selectCategory(item)}
            >
              {item === "All" ? "All clothing" : `${item}'s wear`}
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

      <div className="type-filter" aria-label="Shop by clothing type">
        <span>Shop by type</span>
        <div className="type-filter-options">
          {["All", ...types].map((type) => (
            <button
              type="button"
              key={type}
              className={selectedType.toLowerCase() === type.toLowerCase() ? "type-filter-option active" : "type-filter-option"}
              aria-pressed={selectedType.toLowerCase() === type.toLowerCase()}
              onClick={() => selectType(type)}
            >
              {type === "All" ? "All types" : type}
            </button>
          ))}
        </div>
      </div>

      <div className="shop-refinements">
        <label>
          Sort by
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
        <label>
          Price
          <select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
            <option value="all">Any price</option>
            <option value="5000">Up to Rs. 5,000</option>
            <option value="10000">Up to Rs. 10,000</option>
            <option value="20000">Up to Rs. 20,000</option>
          </select>
        </label>
        <label className="in-stock-filter">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.target.checked)}
          />
          In stock only
        </label>
      </div>

      <div className="shop-results-heading">
        <h2>
          {selectedType !== "All"
            ? selectedType
            : category === "All" ? "All clothing" : `${category}'s wear`}
        </h2>
        <span>{filteredProducts.length} styles</span>
      </div>

      {loading ? (
        <p className="muted catalog-message" role="status">Loading products...</p>
      ) : error ? (
        <div className="catalog-message" role="alert">
          <p>{error}</p>
          <button type="button" className="table-action" onClick={onRetry}>Try again</button>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
          ))}
        </div>
      ) : (
        <p className="empty-results">No matching styles. Try another search.</p>
      )}
    </main>
  );
}
