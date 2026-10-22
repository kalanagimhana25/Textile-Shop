
import { Link } from "react-router-dom";
import { Package, Boxes, CircleDollarSign, Plus } from "lucide-react";

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

  return (
    <main className="section">
      <p className="eyebrow">STORE MANAGEMENT</p>
      <h1>Admin Dashboard</h1>
      <p className="muted">
        Welcome to your textile business overview.
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
                <th>Category</th>
                <th>Dress Type</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.dressType || "-"}</td>
                  <td>Rs. {Number(product.price).toLocaleString()}</td>
                  <td>{product.stock}</td>
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
