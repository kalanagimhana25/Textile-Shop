import { useState } from "react";
import { getVariantStock, normalizeProductInventory } from "../data/product";

const sizes = ["Small", "Medium", "Large"];
const colorOptions = [
  "Black", "Blue", "Brown", "Charcoal", "Cream", "Green", "Grey",
  "Navy", "Olive", "Pink", "Red", "Sand", "Sage", "White", "Other",
];

const createVariant = (color = "") => ({
  key: `${Date.now()}-${Math.random()}`,
  color,
  customColor: "",
  image: "",
  stockBySize: { Small: "5", Medium: "5", Large: "5" },
});

const createDefaultForm = () => ({
  name: "",
  category: "Women",
  type: "Tops",
  price: "",
  material: "",
  fit: "",
  description: "",
  variants: [createVariant()],
});

const resizeImage = (file) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onerror = () => reject(new Error("The selected photo could not be read."));
    fileReader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a valid image."));
      image.onload = () => {
        const maxDimension = 1000;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Photo processing is not supported in this browser."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        if (dataUrl.length > 420_000) {
          reject(new Error("This photo is still too large after compression. Please choose a smaller photo."));
          return;
        }
        resolve(dataUrl);
      };
      image.src = String(fileReader.result);
    };
    fileReader.readAsDataURL(file);
  });

export default function Products({
  products = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) {
  const [form, setForm] = useState(createDefaultForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [uploadingKeys, setUploadingKeys] = useState([]);

  const resetForm = () => {
    setForm(createDefaultForm());
    setEditingId(null);
    setFormError("");
    setUploadingKeys([]);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const updateVariant = (key, update) => {
    setForm((currentForm) => ({
      ...currentForm,
      variants: currentForm.variants.map((variant) =>
        variant.key === key ? { ...variant, ...update } : variant
      ),
    }));
  };

  const handleColorChange = (key, value) => {
    updateVariant(key, {
      color: value,
      customColor: "",
      image: "",
    });
    setFormError("");
  };

  const handlePhotoUpload = async (key, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Choose an image file for this color.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setFormError("Choose an image smaller than 12 MB.");
      return;
    }

    const variant = form.variants.find((item) => item.key === key);
    if (!variant?.color) {
      setFormError("Select a color before uploading its photo.");
      return;
    }

    setFormError("");
    setUploadingKeys((currentKeys) => [...currentKeys, key]);
    try {
      const image = await resizeImage(file);
      updateVariant(key, { image });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setUploadingKeys((currentKeys) => currentKeys.filter((item) => item !== key));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");

    const variants = form.variants.map((variant) => ({
      ...variant,
      color: variant.color === "Other" ? variant.customColor.trim() : variant.color,
    }));

    if (!form.name.trim()) {
      setFormError("Enter a product name.");
      return;
    }
    if (variants.some((variant) => !variant.color)) {
      setFormError("Select a color for every clothing variant.");
      return;
    }
    if (new Set(variants.map((variant) => variant.color.toLowerCase())).size !== variants.length) {
      setFormError("Each color can only be added once to a product.");
      return;
    }
    if (variants.some((variant) => !variant.image)) {
      setFormError("Upload a photo for every selected color before saving.");
      return;
    }
    if (uploadingKeys.length > 0) {
      setFormError("Wait for the color photos to finish uploading.");
      return;
    }

    const colors = variants.map((variant) => variant.color);
    const colorImages = Object.fromEntries(
      variants.map((variant) => [variant.color, variant.image])
    );
    const stockByColorSize = Object.fromEntries(
      variants.map((variant) => [
        variant.color,
        Object.fromEntries(
          sizes.map((size) => [
            size,
            Math.max(0, Number(variant.stockBySize[size]) || 0),
          ])
        ),
      ])
    );
    const stockBySize = Object.fromEntries(
      sizes.map((size) => [
        size,
        variants.reduce(
          (total, variant) => total + Number(variant.stockBySize[size] || 0),
          0
        ),
      ])
    );
    const productData = {
      name: form.name.trim(),
      category: form.category,
      type: form.type.trim(),
      price: Number(form.price) || 0,
      stockByColorSize,
      stockBySize,
      stock: Object.values(stockBySize).reduce((total, count) => total + count, 0),
      color: colors[0],
      colors,
      colorImages,
      sizes,
      material: form.material.trim(),
      fit: form.fit.trim(),
      description: form.description.trim(),
      image: colorImages[colors[0]],
    };

    if (editingId) {
      onUpdateProduct?.(editingId, productData);
    } else {
      onAddProduct?.({ ...productData, id: Date.now() });
    }
    resetForm();
  };

  const handleEdit = (product) => {
    const normalizedProduct = normalizeProductInventory(product);
    setEditingId(product.id);
    setForm({
      name: normalizedProduct.name,
      category: normalizedProduct.category,
      type: normalizedProduct.type || "",
      price: String(normalizedProduct.price),
      material: normalizedProduct.material || "",
      fit: normalizedProduct.fit || "",
      description: normalizedProduct.description || "",
      variants: normalizedProduct.colors.map((color) => ({
        ...createVariant(colorOptions.includes(color) ? color : "Other"),
        customColor: colorOptions.includes(color) ? "" : color,
        image: normalizedProduct.colorImages?.[color] || "",
        stockBySize: Object.fromEntries(
          sizes.map((size) => [
            size,
            String(getVariantStock(normalizedProduct, color, size)),
          ])
        ),
      })),
    });
    setFormError("");
  };

  const inventoryRows = products.flatMap((product) =>
    (product.colors || [product.color || "Default"]).flatMap((color) =>
      (product.sizes || sizes).map((size) => ({
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
      <h1>Manage clothing</h1>

      <div className="admin-form-card">
        <h2>{editingId ? "Update item" : "Add clothing item"}</h2>
        <p className="muted">
          Add each color separately and upload a photo that shows that color.
        </p>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-grid">
            <label>
              Product name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Relaxed Linen Trousers"
                required
              />
            </label>
            <label>
              Department
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="Men">Men&apos;s wear</option>
                <option value="Women">Women&apos;s wear</option>
              </select>
            </label>
            <label>
              Clothing type
              <input name="type" value={form.type} onChange={handleChange} placeholder="e.g. Trousers, Dresses" required />
            </label>
            <label>
              Price (Rs.)
              <input type="number" name="price" value={form.price} onChange={handleChange} min="0" required />
            </label>
            <label>
              Material
              <input name="material" value={form.material} onChange={handleChange} placeholder="Linen blend" />
            </label>
            <label>
              Fit
              <input name="fit" value={form.fit} onChange={handleChange} placeholder="Relaxed fit" />
            </label>

            <div className="full-width admin-variants">
              <div className="admin-variants-heading">
                <strong>Color options and photos</strong>
                <button
                  type="button"
                  className="table-action"
                  onClick={() => setForm((currentForm) => ({
                    ...currentForm,
                    variants: [...currentForm.variants, createVariant()],
                  }))}
                >
                  Add another color
                </button>
              </div>
              {form.variants.map((variant, index) => (
                <section className="admin-variant-card" key={variant.key}>
                  <div className="admin-variant-heading">
                    <strong>Color option {index + 1}</strong>
                    {form.variants.length > 1 && (
                      <button
                        type="button"
                        className="table-action danger"
                        onClick={() => setForm((currentForm) => ({
                          ...currentForm,
                          variants: currentForm.variants.filter((item) => item.key !== variant.key),
                        }))}
                      >
                        Remove color
                      </button>
                    )}
                  </div>

                  <div className="variant-color-photo">
                    <label>
                      Select color
                      <select
                        value={variant.color}
                        onChange={(event) => handleColorChange(variant.key, event.target.value)}
                        required
                      >
                        <option value="" disabled>Choose a color</option>
                        {colorOptions.map((color) => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </label>
                    {variant.color === "Other" && (
                      <label>
                        Color name
                        <input
                          value={variant.customColor}
                          onChange={(event) => updateVariant(variant.key, { customColor: event.target.value })}
                          placeholder="Enter color name"
                          required
                        />
                      </label>
                    )}
                    <label className="photo-upload-field">
                      Photo for {variant.color === "Other" ? (variant.customColor || "this color") : (variant.color || "this color")}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handlePhotoUpload(variant.key, event.target.files?.[0])}
                      />
                      <small>Required. The product photo must match this color.</small>
                    </label>
                    {variant.image && (
                      <img
                        className="variant-photo-preview"
                        src={variant.image}
                        alt={`${variant.color === "Other" ? variant.customColor : variant.color} product preview`}
                      />
                    )}
                  </div>

                  <div className="variant-stock-row">
                    <strong>{variant.color === "Other" ? (variant.customColor || "Color") : (variant.color || "Color")} stock</strong>
                    {sizes.map((size) => (
                      <label key={`${variant.key}-${size}`}>
                        {size}
                        <input
                          type="number"
                          min="0"
                          value={variant.stockBySize[size]}
                          onChange={(event) => updateVariant(variant.key, {
                            stockBySize: {
                              ...variant.stockBySize,
                              [size]: event.target.value,
                            },
                          })}
                          required
                        />
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <label className="full-width">
              Description
              <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
            </label>
          </div>

          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={uploadingKeys.length > 0}>
              {uploadingKeys.length > 0
                ? "Processing photo..."
                : editingId
                  ? "Update item"
                  : "Add item"}
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
        <h2>Current clothing collection</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Product</th><th>Department</th><th>Type</th><th>Price</th><th>Color</th><th>Size</th><th>Photo</th><th>Stock</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {inventoryRows.map(({ product, color, size, stock, image }) => (
                <tr key={`${product.id}-${color}-${size}`}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.type}</td>
                  <td>Rs. {Number(product.price).toLocaleString()}</td>
                  <td>{color}</td>
                  <td>{size}</td>
                  <td><img className="inventory-thumbnail" src={image} alt={`${product.name}, ${color}, ${size}`} /></td>
                  <td>{stock}</td>
                  <td>
                    <div className="inline-actions">
                      <button type="button" className="table-action" onClick={() => handleEdit(product)}>Edit</button>
                      <button type="button" className="table-action danger" onClick={() => onDeleteProduct?.(product.id)}>Delete</button>
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
