
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import AdminDashboard from "./pages/AdminDashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Wishlist from "./pages/Wishlist";
import {
  getVariantStock,
  normalizeProductInventory,
  products as defaultProducts,
} from "./data/product";
import "./index.css";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const readStoredCart = () => {
  if (typeof window === "undefined") return [];

  try {
    const savedCart = window.localStorage.getItem("clothing-cart-v2");
    if (!savedCart) return [];
    const storedCart = JSON.parse(savedCart);
    if (!Array.isArray(storedCart)) return [];

    return storedCart.map((item) => {
      const product = defaultProducts.find((entry) => entry.id === item.id);
      const size = item.size || "Medium";
      const color = item.color || product?.color || "Default";
      const variantStock = Number(item.variantStock ?? (
        product ? getVariantStock(product, color, size) : item.stock ?? 0
      ));

      return {
        ...product,
        ...item,
        size,
        color,
        variantStock,
        image: item.image || product?.colorImages?.[color] || product?.image || "",
        cartId: item.cartId || `${item.id}-${color}-${size}`,
        quantity: Math.max(1, Number(item.quantity) || 1),
      };
    });
  } catch {
    return [];
  }
};

const readStoredFavorites = () => {
  if (typeof window === "undefined") return [];
  try {
    const savedFavorites = JSON.parse(window.localStorage.getItem("clothing-favorites-v1") || "[]");
    return Array.isArray(savedFavorites) ? savedFavorites : [];
  } catch {
    return [];
  }
};

const readStoredProducts = () => {
  if (typeof window === "undefined") return defaultProducts;

  try {
    const savedProducts = window.localStorage.getItem("clothing-products-v2");
    if (!savedProducts) return defaultProducts;

    const storedProducts = JSON.parse(savedProducts);
    if (!Array.isArray(storedProducts)) return defaultProducts;

    return storedProducts.map((product) => {
      const defaultProduct = defaultProducts.find((item) => item.id === product.id);
      const savedColorImages = product.colorImages || {};
      const colorImages = { ...defaultProduct?.colorImages, ...savedColorImages };

      if (colorImages.Olive === "https://images.unsplash.com/photo-1506629905607-d9c297d7d4be?w=900") {
        colorImages.Olive = defaultProduct?.colorImages?.Olive || colorImages.Olive;
      }
      if (colorImages.Black === "https://images.unsplash.com/photo-1564257577-6a5a9c5e1ba3?w=900") {
        colorImages.Black = defaultProduct?.colorImages?.Black || colorImages.Black;
      }

      return normalizeProductInventory({
        ...defaultProduct,
        ...product,
        colors: product.colors?.length ? product.colors : [product.color || "Default"],
        colorImages,
      });
    });
  } catch {
    return defaultProducts;
  }
};

export default function App() {
  const [cart, setCart] = useState(readStoredCart);
  const [products, setProducts] = useState(readStoredProducts);
  const [favorites, setFavorites] = useState(readStoredFavorites);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("clothing-cart-v2", JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("clothing-products-v2", JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("clothing-favorites-v1", JSON.stringify(favorites));
    }
  }, [favorites]);

  const toggleFavorite = (productId) => {
    setFavorites((currentFavorites) =>
      currentFavorites.some((id) => String(id) === String(productId))
        ? currentFavorites.filter((id) => String(id) !== String(productId))
        : [...currentFavorites, productId]
    );
  };

  const addProduct = (newProduct) => {
    setProducts((currentProducts) => {
      const normalizedProduct = {
        ...newProduct,
        id: newProduct.id ?? Date.now(),
        price: Number(newProduct.price) || 0,
      };

      return [...currentProducts, normalizeProductInventory(normalizedProduct)];
    });
  };

  const updateProduct = (productId, updatedProduct) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        if (product.id !== productId) return product;

        return normalizeProductInventory({
              ...product,
              ...updatedProduct,
              price: Number(updatedProduct.price) || 0,
        });
      })
    );
  };

  const deleteProduct = (productId) => {
    setProducts((currentProducts) => {
      if (productId === undefined || productId === null) return currentProducts;

      const productIndex = currentProducts.findIndex(
        (product) => product.id === productId
      );
      if (productIndex === -1) return currentProducts;

      return currentProducts.filter((_, index) => index !== productIndex);
    });
  };

  const addToCart = (product) => {
    setCart((currentCart) => {
      const cartId = `${product.id}-${product.color}-${product.size}`;
      const currentProduct = products.find((item) => item.id === product.id) || product;
      const variantStock = getVariantStock(currentProduct, product.color, product.size);
      const existingItem = currentCart.find((item) => (item.cartId || `${item.id}-${item.color}-${item.size}`) === cartId);

      if (variantStock < 1 || (existingItem?.quantity || 0) >= variantStock) {
        return currentCart;
      }

      if (existingItem) {
        return currentCart.map((item) =>
          (item.cartId || `${item.id}-${item.color}-${item.size}`) === cartId
            ? { ...item, variantStock, quantity: Math.min(item.quantity + 1, variantStock) }
            : item
        );
      }

      return [...currentCart, { ...product, variantStock, cartId, quantity: 1 }];
    });
  };

  const updateQuantity = (cartId, change) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if ((item.cartId || `${item.id}-${item.color}-${item.size}`) !== cartId) {
            return item;
          }

          const product = products.find((entry) => entry.id === item.id);
          const variantStock = product
            ? getVariantStock(product, item.color, item.size)
            : Number(item.variantStock ?? item.stock ?? 0);

          return {
              ...item,
              quantity: Math.min(item.quantity + change, variantStock),
              variantStock,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (cartId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => (item.cartId || `${item.id}-${item.color}-${item.size}`) !== cartId)
    );
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartForDisplay = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    const variantStock = product
      ? getVariantStock(product, item.color, item.size)
      : Number(item.variantStock ?? item.stock ?? 0);

    return { ...item, variantStock };
  });
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shipping = cart.length > 0 ? 250 : 0;
  const total = subtotal + shipping;

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar cartCount={cartItemCount} favoriteCount={favorites.length} />

      <Routes>
        <Route path="/" element={<Home products={products} favorites={favorites} onToggleFavorite={toggleFavorite} />} />
        <Route
          path="/shop"
          element={
            <Shop
              products={products}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          }
        />
        <Route
          path="/favorites"
          element={
            <Wishlist
              products={products}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          }
        />
        <Route
          path="/product/:productId"
          element={
            <ProductDetail
              products={products}
              cart={cart}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onAddToCart={addToCart}
            />
          }
        />
        <Route
          path="/cart"
          element={
            <Cart
              cart={cartForDisplay}
              onUpdateQuantity={updateQuantity}
              onRemoveFromCart={removeFromCart}
              subtotal={subtotal}
              shipping={shipping}
              total={total}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <AdminDashboard
              products={products}
              onDeleteProduct={deleteProduct}
            />
          }
        />
        <Route
          path="/admin/products"
          element={
            <Products
              products={products}
              onAddProduct={addProduct}
              onUpdateProduct={updateProduct}
              onDeleteProduct={deleteProduct}
            />
          }
        />
        <Route path="/admin/orders" element={<Orders />} />
      </Routes>

      <footer className="footer">
        <p>DAYFORM — Everyday style, made to wear.</p>
      </footer>
    </BrowserRouter>
  );
}
