
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import AdminDashboard from "./pages/AdminDashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import { products as defaultProducts } from "./data/product";
import "./index.css";

const readStoredCart = () => {
  if (typeof window === "undefined") return [];

  try {
    const savedCart = window.localStorage.getItem("thread-cart");
    return savedCart ? JSON.parse(savedCart) : [];
  } catch {
    return [];
  }
};

const readStoredProducts = () => {
  if (typeof window === "undefined") return defaultProducts;

  try {
    const savedProducts = window.localStorage.getItem("thread-products");
    return savedProducts ? JSON.parse(savedProducts) : defaultProducts;
  } catch {
    return defaultProducts;
  }
};

export default function App() {
  const [cart, setCart] = useState(readStoredCart);
  const [products, setProducts] = useState(readStoredProducts);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("thread-cart", JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("thread-products", JSON.stringify(products));
    }
  }, [products]);

  const addProduct = (newProduct) => {
    setProducts((currentProducts) => {
      const normalizedProduct = {
        ...newProduct,
        id: newProduct.id ?? Date.now(),
        price: Number(newProduct.price) || 0,
        stock: Number(newProduct.stock) || 0,
      };

      return [...currentProducts, normalizedProduct];
    });
  };

  const updateProduct = (productId, updatedProduct) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              ...updatedProduct,
              price: Number(updatedProduct.price) || 0,
              stock: Number(updatedProduct.stock) || 0,
            }
          : product
      )
    );
  };

  const deleteProduct = (productId) => {
    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== productId)
    );
  };

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, change) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shipping = cart.length > 0 ? 250 : 0;
  const total = subtotal + shipping;

  return (
    <BrowserRouter>
      <Navbar cartCount={cartItemCount} />

      <Routes>
        <Route path="/" element={<Home onAddToCart={addToCart} products={products} />} />
        <Route path="/shop" element={<Shop onAddToCart={addToCart} products={products} />} />
        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
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
        <p>THREAD & CO. — Quality in every thread.</p>
      </footer>
    </BrowserRouter>
  );
}
