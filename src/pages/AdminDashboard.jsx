
import { Link } from "react-router-dom";
import { Package, Boxes, CircleDollarSign, Plus } from "lucide-react";
import { getVariantStock } from "../data/product";

export default function AdminDashboard({ products = [], onDeleteProduct }) {
  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );

  const stockValue = products.reduce(
    (total, product) => total + Number(product.price || 0) * Number(product.stock || 0),
    0
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

  const inventoryRows = products.flatMap((product) =>
    (product.colors || [product.color || "Default"]).flatMap((color) =>
      (product.sizes || ["Small", "Medium", "Large"]).map((size) => ({
        product,
        color,
        size,
        stock: getVariantStock(product, color, size),
        image: product.colorImages?.[color] || product.image,
      }))
    )
  );

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
        <h2>Inventory Overview</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Department</th>
                <th>Type</th>
                <th>Price</th>
                <th>Color</th>
                <th>Size</th>
                <th>Photo</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {inventoryRows.map(({ product, color, size, stock, image }) => (
                <tr key={`${product.id}-${color}-${size}`}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.type || "-"}</td>
                  <td>Rs. {Number(product.price).toLocaleString()}</td>
                  <td>{color}</td>
                  <td>{size}</td>
                  <td><img className="inventory-thumbnail" src={image} alt={`${product.name}, ${color}, ${size}`} /></td>
                  <td>{stock}</td>
                  <td>
                    <button
                      type="button"
                      className="table-action danger"
                      onClick={() => onDeleteProduct && onDeleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
