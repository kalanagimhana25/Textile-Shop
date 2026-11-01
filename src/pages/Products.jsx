import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getProductSizes,
  getVariantStock,
  normalizeProductInventory,
  remapStockBySize,
  standardSizes,
} from "../data/product";
import { getColorSwatch } from "../data/color";

const commonTypes = [
  "Frocks",
  "Dresses",
  "Pants",
  "Trousers",
  "T-shirts",
  "Shirts",
  "Tops",
  "Skirts",
  "Jackets",
  "Shorts",
];
const colorOptions = [
  "Black", "Blue", "Brown", "Charcoal", "Cream", "Green", "Grey",
  "Navy", "Olive", "Pink", "Red", "Sand", "Sage", "White",
];
const CUSTOM_COLOR = "__custom_color__";

const createVariant = (color = "", sizes = standardSizes) => ({
  key: `${Date.now()}-${Math.random()}`,
  color,
  swatch: getColorSwatch(color),
  customColor: "",
  image: "",
  stockBySize: Object.fromEntries(sizes.map((size) => [size, "5"])),
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

const createProductForm = (product, knownColors = colorOptions) => {
  const normalizedProduct = normalizeProductInventory(product);
  const selectableColors = new Set(
    [...knownColors, ...normalizedProduct.colors].map((color) => color.toLowerCase())
  );
  return {
    name: normalizedProduct.name,
    category: normalizedProduct.category,
    type: normalizedProduct.type || "",
    price: String(normalizedProduct.price),
    material: normalizedProduct.material || "",
    fit: normalizedProduct.fit || "",
    description: normalizedProduct.description || "",
    variants: normalizedProduct.colors.map((color) => ({
      ...createVariant(
        selectableColors.has(color.toLowerCase()) ? color : CUSTOM_COLOR,
        normalizedProduct.sizes
      ),
      swatch: normalizedProduct.colorSwatches?.[color] || getColorSwatch(color),
      customColor: selectableColors.has(color.toLowerCase()) ? "" : color,
      image: normalizedProduct.colorImages?.[color] || "",
      stockBySize: Object.fromEntries(
        normalizedProduct.sizes.map((size) => [
          size,
          String(getVariantStock(normalizedProduct, color, size)),
        ])
      ),
    })),
  };
};

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
  const [searchParams] = useSearchParams();
  const selectableColors = [...new Set(
    [...colorOptions, ...products.flatMap((product) => product.colors || [product.color])]
      .filter(Boolean)
      .map((color) => color.trim())
  )].sort((first, second) => first.localeCompare(second));
  const initialEditProduct = products.find(
    (product) => String(product.id) === searchParams.get("edit")
  );
  const [form, setForm] = useState(() =>
    initialEditProduct ? createProductForm(initialEditProduct, selectableColors) : createDefaultForm()
  );
  const [editingId, setEditingId] = useState(initialEditProduct?.id ?? null);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [formError, setFormError] = useState("");
  const [uploadingKeys, setUploadingKeys] = useState([]);
  const [customType, setCustomType] = useState("");
  const productTypes = [...new Set(
    [...commonTypes, ...products.map((product) => product.type)]
      .filter(Boolean)
      .map((type) => type.trim())
  )].sort((first, second) => first.localeCompare(second));

  const resetForm = () => {
    setForm(createDefaultForm());
    setEditingId(null);
    setFormError("");
    setUploadingKeys([]);
    setCustomType("");
    setIsFormVisible(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleTypeChange = (event) => {
    const { value } = event.target;
    const nextSizes = getProductSizes(value === "Other" ? "" : value);
    setForm((currentForm) => {
      const currentType = currentForm.type === "Other" ? customType : currentForm.type;
      const currentSizes = getProductSizes(currentType);
      return {
        ...currentForm,
        type: value,
        variants: currentForm.variants.map((variant) => ({
          ...variant,
          stockBySize: Object.fromEntries(
            Object.entries(remapStockBySize(variant.stockBySize, currentSizes, nextSizes))
              .map(([size, stock]) => [size, String(stock)])
          ),
        })),
      };
    });
    setCustomType("");
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
      swatch: getColorSwatch(value),
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

    const type = form.type === "Other" ? customType.trim() : form.type.trim();
    const productSizes = getProductSizes(type);
    const variants = form.variants.map((variant) => ({
      ...variant,
      color: variant.color === CUSTOM_COLOR ? variant.customColor.trim() : variant.color,
    }));

    if (!form.name.trim()) {
      setFormError("Enter a product name.");
      return;
    }
    if (!type) {
      setFormError("Choose a clothing type or enter a new one.");
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
    const colorSwatches = Object.fromEntries(
      variants.map((variant) => [variant.color, variant.swatch])
    );
    const stockByColorSize = Object.fromEntries(
      variants.map((variant) => [
        variant.color,
        Object.fromEntries(
          productSizes.map((size) => [
            size,
            Math.max(0, Number(variant.stockBySize[size]) || 0),
          ])
        ),
      ])
    );
    const stockBySize = Object.fromEntries(
      productSizes.map((size) => [
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
      type,
      price: Number(form.price) || 0,
      stockByColorSize,
      stockBySize,
      stock: Object.values(stockBySize).reduce((total, count) => total + count, 0),
      color: colors[0],
      colors,
      colorImages,
      colorSwatches,
      sizes: productSizes,
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
    setEditingId(product.id);
    setForm(createProductForm(product, selectableColors));
    setFormError("");
    setIsFormVisible(true);
  };

  const inventoryRows = products.flatMap((product) =>
    (product.colors || [product.color || "Default"]).flatMap((color) =>
      (product.sizes || getProductSizes(product.type)).map((size) => ({
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

      {!isFormVisible && (
        <button
          type="button"
          className="primary-button"
          onClick={() => setIsFormVisible(true)}
        >
          Add clothing item
        </button>
      )}

      {isFormVisible && <div className="admin-form-card">
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
              <select
                name="type"
                value={productTypes.includes(form.type) ? form.type : form.type ? "Other" : ""}
                onChange={handleTypeChange}
                required
              >
                <option value="" disabled>Choose a type</option>
                {productTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
                <option value="Other">Add a new type...</option>
              </select>
              {form.type === "Other" && (
                <input
                  value={customType}
                  onChange={(event) => setCustomType(event.target.value)}
                  placeholder="e.g. Jumpsuits"
                  aria-label="New clothing type"
                  required
                />
              )}
              <small>Examples: frocks, pants, T-shirts, shirts, skirts, jackets.</small>
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
                    variants: [
                      ...currentForm.variants,
                      createVariant("", getProductSizes(form.type === "Other" ? customType : form.type)),
                    ],
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
                        {selectableColors.map((color) => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                        <option value={CUSTOM_COLOR}>Add a new color...</option>
                      </select>
                    </label>
                    <label>
                      Swatch shown to shoppers
                      <input
                        type="color"
                        value={variant.swatch}
                        onChange={(event) => updateVariant(variant.key, { swatch: event.target.value })}
                      />
                    </label>
                    {variant.color === CUSTOM_COLOR && (
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
                      Photo for {variant.color === CUSTOM_COLOR ? (variant.customColor || "this color") : (variant.color || "this color")}
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
                        alt={`${variant.color === CUSTOM_COLOR ? variant.customColor : variant.color} product preview`}
                      />
                    )}
                  </div>

                  <div className="variant-stock-row">
                    <strong>{variant.color === CUSTOM_COLOR ? (variant.customColor || "Color") : (variant.color || "Color")} stock</strong>
                    {getProductSizes(form.type === "Other" ? customType : form.type).map((size) => (
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
      </div>}

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
