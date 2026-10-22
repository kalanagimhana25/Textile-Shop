
import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, LayoutDashboard } from "lucide-react";

export default function Navbar({ cartCount = 0 }) {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        THREAD<span> & </span>CO.
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/shop">Shop</NavLink>
        <NavLink to="/cart">
          <ShoppingBag size={18} />
          Cart
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </NavLink>
        <NavLink to="/admin">
          <LayoutDashboard size={18} />
          Admin
        </NavLink>
      </nav>
    </header>
  );
}
