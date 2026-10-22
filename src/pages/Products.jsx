import { useState } from "react";

const defaultForm = {
  id: "",
  name: "",
  category: "Cotton",
  dressType: "Skirt",
  price: "",
  stock: "",
  color: "",
  image: "",
};

export default function Products({
  products = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) {
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) return;

    const productData = {
      ...form,
      name: form.name.trim(),
      category: form.category || "Cotton",
      dressType: form.dressType || "Skirt",
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      color: form.color || "Custom",
      image:
        form.image ||
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
    };

    if (editingId) {
      onUpdateProduct?.(editingId, productData);
    } else {
      onAddProduct?.({ ...productData, id: Date.now() });
    }

    resetForm();
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      ...product,
      price: String(product.price),
      stock: String(product.stock),
    });
  };

  return (
    <main className="section">
      <p className="eyebrow">STORE MANAGEMENT</p>
      <h1>Manage Dresses & Fabrics</h1>

      <div className="admin-form-card">
        <h2>{editingId ? "Update Product" : "Add New Product"}</h2>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-grid">
            <label>
              Product name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Linen Pleated Skirt"
              />
            </label>

            <label>
              Fabric
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="Cotton">Cotton</option>
                <option value="Linen">Linen</option>
                <option value="Blends">Blends</option>
              </select>
            </label>

            <label>
              Dress type
              <select name="dressType" value={form.dressType} onChange={handleChange}>
                <option value="Skirt">Skirt</option>
                <option value="Pants">Pants</option>
                <option value="Shirt">Shirt</option>
              </select>
            </label>

            <label>
              Price (Rs.)
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
              />
            </label>

            <label>
              Stock
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                min="0"
              />
            </label>

            <label>
              Color
              <input
                type="text"
                name="color"
                value={form.color}
                onChange={handleChange}
                placeholder="Ivory"
              />
            </label>

            <label className="full-width">
              Image URL
              <input
                type="url"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://..."
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingId ? "Update product" : "Add product"}
            </button>
            {editingId && (
              <button type="button" className="secondary-button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <section className="admin-panel product-list-panel">
        <h2>Current Catalog</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Fabric</th>
                <th>Type</th>
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
                  <td>{product.dressType}</td>
                  <td>Rs. {Number(product.price).toLocaleString()}</td>
                  <td>{product.stock}</td>
                  <td>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="table-action"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
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
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
