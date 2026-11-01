
import { Link } from "react-router-dom";
import { Package, Boxes, CircleDollarSign, Plus } from "lucide-react";
import { getVariantStock } from "../data/product";

export default function AdminDashboard({ products = [], onDeleteProduct }) {
  const totalProducts = products.length;
  const productRows = products.map((product) => {
    const colors = product.colors?.length ? product.colors : [product.color || "Default"];
    const sizes = product.sizes?.length ? product.sizes : ["Small", "Medium", "Large"];
    const stock = colors.reduce(
      (total, color) =>
        total + sizes.reduce((colorTotal, size) => colorTotal + getVariantStock(product, color, size), 0),
      0
    );

    return {
      product,
      stock,
      colors,
      image: product.colorImages?.[colors[0]] || product.image,
    };
  });
  const totalStock = productRows.reduce((total, row) => total + row.stock, 0);
  const stockValue = productRows.reduce(
    (total, row) => total + Number(row.product.price || 0) * row.stock,
    0
  );
  const types = Object.values(productRows.reduce((grouped, row) => {
    const type = row.product.type?.trim() || "Other";
    const key = `${row.product.category || "Uncategorized"}-${type.toLowerCase()}`;
    if (!grouped[key]) {
      grouped[key] = { category: row.product.category || "Uncategorized", type, products: 0, stock: 0 };
    }
    grouped[key].products += 1;
    grouped[key].stock += row.stock;
    return grouped;
  }, {})).sort((first, second) =>
    first.category.localeCompare(second.category) || first.type.localeCompare(second.type)
  );

  const stats = [
    {
      title: "Products",
      value: totalProducts,
      icon: Package,
    },
    {
      title: "Items in Stock",
      value: totalStock,
      icon: Boxes,
    },
    {
      title: "Stock Value",
      value: `Rs. ${stockValue.toLocaleString()}`,
      icon: CircleDollarSign,
    },
  ];

  return (
    <main className="section">
      <p className="eyebrow">STORE MANAGEMENT</p>
      <h1>Admin Dashboard</h1>
      <p className="muted">
        Your clothing store at a glance.
      </p>

      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="stat-card" key={stat.title}>
              <Icon size={26} />
              <p>{stat.title}</p>
              <h2>{stat.value}</h2>
            </article>
          );
        })}
      </div>

      <div className="admin-actions">
        <Link to="/admin/products" className="primary-button">
          <Plus size={16} />
          Manage products
        </Link>
      </div>

      <section className="admin-panel">
        <h2>Clothing types</h2>
        {types.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Department</th><th>Type</th><th>Products</th><th>Items in Stock</th></tr>
              </thead>
              <tbody>
                {types.map((type) => (
                  <tr key={`${type.category}-${type.type}`}>
                    <td>{type.category}</td>
                    <td>{type.type}</td>
                    <td>{type.products}</td>
                    <td>{type.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No products have been added yet.</p>
        )}
      </section>

      <section className="admin-panel">
        <h2>Products and stock</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Department</th>
                <th>Type</th>
                <th>Price</th>
                <th>Colors</th>
                <th>Photo</th>
                <th>Total Items</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {productRows.map(({ product, stock, colors, image }) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.type || "-"}</td>
                  <td>Rs. {Number(product.price).toLocaleString()}</td>
                  <td>{colors.join(", ")}</td>
                  <td><img className="inventory-thumbnail" src={image} alt={`${product.name}`} /></td>
                  <td>{stock}</td>
                  <td>
                    <div className="inline-actions">
                      <Link
                        to={`/admin/products?edit=${encodeURIComponent(String(product.id))}`}
                        className="table-action"
                      >
                        Edit / add color
                      </Link>
                      <button
                        type="button"
                        className="table-action danger"
                        onClick={() => onDeleteProduct?.(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {productRows.length === 0 && (
                <tr><td colSpan="8">No products have been added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
