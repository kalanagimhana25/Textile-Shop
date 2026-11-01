
import { Link, NavLink } from "react-router-dom";
import { Heart, ShoppingBag, LayoutDashboard, LogIn, LogOut } from "lucide-react";

export default function Navbar({
  cartCount = 0,
  favoriteCount = 0,
  user = null,
  authLoading = false,
  onLogout,
}) {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        DAY<span>FORM</span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/shop">Shop</NavLink>
        <Link to="/shop?category=Men">Men</Link>
        <Link to="/shop?category=Women">Women</Link>
        <NavLink to="/favorites">
          <Heart size={18} />
          Favorites
          {favoriteCount > 0 && <span className="cart-badge">{favoriteCount}</span>}
        </NavLink>
        {user?.role === "customer" && <NavLink to="/orders">Orders</NavLink>}
        <NavLink to="/cart">
          <ShoppingBag size={18} />
          Cart
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </NavLink>
        <NavLink to="/admin">
          <LayoutDashboard size={18} />
          Admin
        </NavLink>
        {user ? (
          <button type="button" className="nav-action" onClick={onLogout} title={`Signed in as ${user.email}`}>
            <LogOut size={18} />
            Sign out
          </button>
        ) : !authLoading && (
          <NavLink to="/login">
            <LogIn size={18} />
            Sign in
          </NavLink>
        )}
      </nav>
    </header>
  );
}
