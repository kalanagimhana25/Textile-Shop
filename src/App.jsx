import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { getVariantStock, products as legacyProducts } from "./data/product";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import Cart from "./pages/Cart";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Shop from "./pages/Shop";
import Wishlist from "./pages/Wishlist";
import { apiRequest, readStoredAuth, setUnauthorizedHandler, storeAuth } from "./services/api";
import { mapApiProduct, toApiProduct } from "./services/catalog";
import "./index.css";

const CART_STORAGE_KEY = "clothing-cart-v2";
const FAVORITES_STORAGE_KEY = "clothing-favorites-v1";

function readStoredArray(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readStoredCart() {
  return readStoredArray(CART_STORAGE_KEY).map((item) => ({
    ...item,
    size: item.size || "Medium",
    color: item.color || "Default",
    cartId: item.cartId || `${item.id}-${item.color || "Default"}-${item.size || "Medium"}`,
    quantity: Math.max(1, Number(item.quantity) || 1),
  }));
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AdminOnly({ loading, user, children }) {
  if (loading) {
    return <main className="section"><p className="muted" role="status">Checking your account...</p></main>;
  }
  if (user?.role !== "admin") {
    return (
      <main className="section">
        <p className="eyebrow">ADMIN ACCESS</p>
        <h1>Administrator access required</h1>
        <p className="muted">Sign in with an administrator account to manage store products.</p>
        <Link to="/login" className="primary-button">Sign in</Link>
      </main>
    );
  }

  return children;
}

export default function App() {
  const [cart, setCart] = useState(readStoredCart);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [favorites, setFavorites] = useState(() => readStoredArray(FAVORITES_STORAGE_KEY));
  const [authToken, setAuthToken] = useState(() => readStoredAuth()?.token || "");
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(readStoredAuth()?.token));
  const [adminError, setAdminError] = useState("");

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const [productResponse, categoryResponse, departmentResponse] = await Promise.all([
        apiRequest("/products"),
        apiRequest("/categories"),
        apiRequest("/departments"),
      ]);
      const nextProducts = (productResponse.data?.products || []).map(mapApiProduct);
      const nextCategories = categoryResponse.data?.categories || [];
      const nextDepartments = departmentResponse.data?.departments || [];
      setProducts(nextProducts);
      setCategories(nextCategories);
      setDepartments(nextDepartments);

      const productsByName = new Map(
        nextProducts.map((product) => [product.name.trim().toLowerCase(), product])
      );
      const legacyNameById = new Map(
        legacyProducts.map((product) => [String(product.id), product.name.trim().toLowerCase()])
      );
      const resolveProduct = (id, name) =>
        productsByName.get(String(name || legacyNameById.get(String(id)) || "").trim().toLowerCase());

      setCart((currentCart) => currentCart.map((item) => {
        const product = resolveProduct(item.id, item.name);
        if (!product) return item;
        const variantStock = getVariantStock(product, item.color, item.size);
        return {
          ...item,
          ...product,
          id: product.id,
          image: product.colorImages?.[item.color] || item.image || product.image,
          variantStock,
          quantity: Math.min(item.quantity, variantStock),
          cartId: `${product.id}-${item.color}-${item.size}`,
        };
      }).filter((item) => item.quantity > 0));

      setFavorites((currentFavorites) =>
        [...new Set(currentFavorites.map((id) => {
          const legacyProduct = legacyProducts.find((product) => String(product.id) === String(id));
          return legacyProduct
            ? productsByName.get(legacyProduct.name.trim().toLowerCase())?.id || id
            : id;
        }))]
      );
    } catch (error) {
      setCatalogError(error.message || "Products could not be loaded. Please try again.");
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCatalog();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthToken("");
      setAuthUser(null);
      setAuthLoading(false);
    });

    const savedAuth = readStoredAuth();
    if (!savedAuth?.token) {
      return () => setUnauthorizedHandler(null);
    }

    let active = true;
    apiRequest("/auth/me", { token: savedAuth.token })
      .then((response) => {
        if (!active) return;
        setAuthToken(savedAuth.token);
        setAuthUser(response.data?.user || null);
      })
      .catch(() => {
        if (!active) return;
        storeAuth(null);
        setAuthToken("");
        setAuthUser(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = async (credentials) => {
    const response = await apiRequest("/auth/login", { method: "POST", body: credentials });
    const auth = {
      token: response.data.token,
      user: response.data.user,
    };
    storeAuth(auth);
    setAuthToken(auth.token);
    setAuthUser(auth.user);
  };

  const register = async (details) => {
    await apiRequest("/auth/register", { method: "POST", body: details });
  };

  const logout = () => {
    storeAuth(null);
    setAuthToken("");
    setAuthUser(null);
  };

  const toggleFavorite = (productId) => {
    setFavorites((currentFavorites) =>
      currentFavorites.some((id) => String(id) === String(productId))
        ? currentFavorites.filter((id) => String(id) !== String(productId))
        : [...currentFavorites, productId]
    );
  };

  const addProduct = async (productData) => {
    setAdminError("");
    const body = toApiProduct(productData, categories, departments);
    const response = await apiRequest("/products", { method: "POST", body, token: authToken });
    const product = mapApiProduct(response.data.product);
    setProducts((current) => [...current, product]);
  };

  const updateProduct = async (productId, productData) => {
    setAdminError("");
    const body = toApiProduct(productData, categories, departments);
    const response = await apiRequest(`/products/${encodeURIComponent(productId)}`, {
      method: "PUT",
      body,
      token: authToken,
    });
    const product = mapApiProduct(response.data.product);
    setProducts((current) => current.map((item) => item.id === product.id ? product : item));
  };

  const deleteProduct = async (productId) => {
    setAdminError("");
    await apiRequest(`/products/${encodeURIComponent(productId)}`, {
      method: "DELETE",
      token: authToken,
    });
    setProducts((current) => current.filter((product) => product.id !== String(productId)));
    setFavorites((current) => current.filter((id) => String(id) !== String(productId)));
    setCart((current) => current.filter((item) => String(item.id) !== String(productId)));
  };

  const addToCart = (product) => {
    setCart((currentCart) => {
      const cartId = `${product.id}-${product.color}-${product.size}`;
      const currentProduct = products.find((item) => item.id === product.id) || product;
      const variantStock = getVariantStock(currentProduct, product.color, product.size);
      const existingItem = currentCart.find((item) => item.cartId === cartId);

      if (variantStock < 1 || (existingItem?.quantity || 0) >= variantStock) return currentCart;
      if (existingItem) {
        return currentCart.map((item) => item.cartId === cartId
          ? { ...item, variantStock, quantity: Math.min(item.quantity + 1, variantStock) }
          : item);
      }

      return [...currentCart, { ...product, variantStock, cartId, quantity: 1 }];
    });
  };

  const updateQuantity = (cartId, change) => {
    setCart((currentCart) => currentCart
      .map((item) => {
        if (item.cartId !== cartId) return item;
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
      .filter((item) => item.quantity > 0));
  };

  const removeFromCart = (cartId) => {
    setCart((currentCart) => currentCart.filter((item) => item.cartId !== cartId));
  };

  const cartForDisplay = cart.map((item) => {
    const product = products.find((entry) => entry.id === String(item.id));
    const variantStock = product
      ? getVariantStock(product, item.color, item.size)
      : Number(item.variantStock ?? item.stock ?? 0);
    return { ...item, variantStock };
  });
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = cart.length > 0 ? 250 : 0;
  const total = subtotal + shipping;
  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId);
    } catch (error) {
      setAdminError(error.message || "The product could not be deleted.");
    }
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar
        cartCount={cartItemCount}
        favoriteCount={favorites.length}
        user={authUser}
        authLoading={authLoading}
        onLogout={logout}
      />

      <Routes>
        <Route path="/" element={
          <Home products={products} departments={departments} favorites={favorites}
            onToggleFavorite={toggleFavorite} loading={catalogLoading} error={catalogError}
            onRetry={loadCatalog} />
        } />
        <Route path="/shop" element={
          <Shop products={products} categories={categories} departments={departments}
            favorites={favorites} onToggleFavorite={toggleFavorite}
            loading={catalogLoading} error={catalogError} onRetry={loadCatalog} />
        } />
        <Route path="/favorites" element={
          <Wishlist products={products} favorites={favorites} onToggleFavorite={toggleFavorite}
            loading={catalogLoading} error={catalogError} />
        } />
        <Route path="/product/:productId" element={
          <ProductDetail products={products} cart={cart} favorites={favorites}
            onToggleFavorite={toggleFavorite} onAddToCart={addToCart} />
        } />
        <Route path="/cart" element={
          <Cart cart={cartForDisplay} onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart} subtotal={subtotal} shipping={shipping} total={total} />
        } />
        <Route path="/login" element={<AuthPage mode="login" onLogin={login} />} />
        <Route path="/register" element={<AuthPage mode="register" onRegister={register} />} />
        <Route path="/admin" element={
          <AdminOnly loading={authLoading} user={authUser}>
            <AdminDashboard products={products} loading={catalogLoading} error={catalogError}
              adminError={adminError} onDeleteProduct={handleDeleteProduct} />
          </AdminOnly>
        } />
        <Route path="/admin/products" element={
          <AdminOnly loading={authLoading} user={authUser}>
            <Products key={products.length} products={products} categories={categories} departments={departments}
              loading={catalogLoading} catalogError={catalogError} adminError={adminError}
              onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={handleDeleteProduct} />
          </AdminOnly>
        } />
        <Route path="/admin/orders" element={<Orders />} />
      </Routes>

      <footer className="footer">
        <p>DAYFORM — Everyday style, made to wear.</p>
      </footer>
    </BrowserRouter>
  );
}
