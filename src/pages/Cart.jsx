
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function Cart({
  cart = [],
  onUpdateQuantity = () => {},
  onRemoveFromCart = () => {},
  subtotal = 0,
  shipping = 0,
  total = 0,
}) {
  if (cart.length === 0) {
    return (
      <main className="section">
        <div className="empty-cart">
          <p className="eyebrow">YOUR SELECTION</p>
          <h1>Shopping Cart</h1>
          <p>Your cart is empty right now.</p>
          <Link to="/shop" className="primary-button">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="section cart-section">
      <p className="eyebrow">YOUR SELECTION</p>
      <h1>Shopping Cart</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item) => (
            <article key={item.cartId || `${item.id}-${item.color}-${item.size}`} className="cart-item">
              <img src={item.image} alt={`${item.name} in ${item.color}`} />

              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p>{item.category}</p>
                <span>Color: {item.color} · Size: {item.size}</span>
                <span>
                  {Math.max(0, Number(item.variantStock ?? item.stock ?? 0) - item.quantity)} available
                </span>
              </div>

              <div className="cart-item-controls">
                <button
                  type="button"
                  className="qty-button"
                  onClick={() => onUpdateQuantity(item.cartId || `${item.id}-${item.color}-${item.size}`, -1)}
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  <Minus size={14} />
                </button>

                <span>{item.quantity}</span>

                <button
                  type="button"
                  className="qty-button"
                  onClick={() => onUpdateQuantity(item.cartId || `${item.id}-${item.color}-${item.size}`, 1)}
                  aria-label={`Increase quantity of ${item.name}`}
                  disabled={item.quantity >= Number(item.variantStock ?? item.stock ?? 0)}
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="cart-item-price">
                <strong>Rs. {(item.price * item.quantity).toLocaleString()}</strong>

                <button
                  type="button"
                  className="cart-item-remove"
                  onClick={() => onRemoveFromCart(item.cartId || `${item.id}-${item.color}-${item.size}`)}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toLocaleString()}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>Rs. {shipping.toLocaleString()}</span>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>Rs. {total.toLocaleString()}</span>
          </div>

          <button type="button" className="checkout-button">
            Proceed to Checkout
          </button>

          <Link to="/shop" className="secondary-button">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}
