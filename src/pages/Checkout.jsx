import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const IDEMPOTENCY_STORAGE_KEY = "textile-checkout-idempotency-v1";

function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function getIdempotencyKey() {
  const savedKey = window.sessionStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
  if (savedKey && /^[a-zA-Z0-9_-]{16,128}$/.test(savedKey)) return savedKey;
  const key = createIdempotencyKey();
  window.sessionStorage.setItem(IDEMPOTENCY_STORAGE_KEY, key);
  return key;
}

export default function Checkout({ cart = [], user, token, onOrderPlaced }) {
  const [form, setForm] = useState({
    phone: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "Sri Lanka",
  });
  const [idempotencyKey] = useState(getIdempotencyKey);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await apiRequest("/orders", {
        method: "POST",
        token,
        headers: { "Idempotency-Key": idempotencyKey },
        body: {
          phone: form.phone,
          deliveryAddress: {
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            region: form.region,
            postalCode: form.postalCode,
            country: form.country,
          },
          items: cart.map((item) => ({
            productId: String(item.id),
            color: item.color,
            size: item.size,
            quantity: item.quantity,
          })),
        },
      });
      setOrder(response.data.order);
      window.sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
      onOrderPlaced();
    } catch (requestError) {
      setError(requestError.message || "Your order could not be placed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (order) {
    return (
      <main className="section">
        <div className="checkout-success">
          <p className="eyebrow">ORDER RECEIVED</p>
          <h1>Thank you, {order.customer.fullName}.</h1>
          <p>Your order is pending confirmation. No online payment was taken.</p>
          <div className="cart-summary checkout-confirmation">
            <div className="summary-row">
              <span>Order number</span>
              <strong>{order.orderNumber}</strong>
            </div>
            <div className="summary-row">
              <span>Items subtotal</span>
              <span>Rs. {Number(order.subtotal).toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>Rs. {Number(order.shippingCost).toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>Final total</span>
              <span>Rs. {Number(order.total).toLocaleString()}</span>
            </div>
            <p className="order-status">{order.status}</p>
          </div>
          <div className="form-actions">
            <Link to="/orders" className="primary-button">View my orders</Link>
            <Link to="/shop" className="secondary-button">Continue shopping</Link>
          </div>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="section">
        <div className="empty-cart">
          <p className="eyebrow">CHECKOUT</p>
          <h1>Your cart is empty.</h1>
          <Link to="/shop" className="primary-button">Browse the collection</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <p className="eyebrow">SECURE ORDER PLACEMENT</p>
      <h1>Checkout</h1>
      <p className="muted">Signed in as {user?.email}. Prices and stock are checked by the store before the order is placed.</p>

      <div className="checkout-layout">
        <form className="admin-form admin-form-card checkout-form" onSubmit={handleSubmit}>
          <h2>Delivery details</h2>
          <label>
            Contact phone
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={updateForm}
              autoComplete="tel"
              maxLength={24}
              required
            />
          </label>
          <label>
            Address
            <input
              name="line1"
              value={form.line1}
              onChange={updateForm}
              autoComplete="address-line1"
              maxLength={200}
              required
            />
          </label>
          <label>
            Apartment, suite, etc. (optional)
            <input
              name="line2"
              value={form.line2}
              onChange={updateForm}
              autoComplete="address-line2"
              maxLength={200}
            />
          </label>
          <div className="checkout-address-grid">
            <label>
              City
              <input name="city" value={form.city} onChange={updateForm} autoComplete="address-level2" maxLength={100} required />
            </label>
            <label>
              Province / region (optional)
              <input name="region" value={form.region} onChange={updateForm} autoComplete="address-level1" maxLength={100} />
            </label>
            <label>
              Postal code (optional)
              <input name="postalCode" value={form.postalCode} onChange={updateForm} autoComplete="postal-code" maxLength={24} />
            </label>
            <label>
              Country
              <input name="country" value={form.country} onChange={updateForm} autoComplete="country-name" maxLength={100} required />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Placing order..." : "Place order"}
          </button>
          <p className="muted checkout-payment-note">No payment is collected online in this phase.</p>
        </form>

        <aside className="cart-summary checkout-summary">
          <h2>Order summary</h2>
          {cart.map((item) => (
            <div className="checkout-summary-item" key={item.cartId}>
              <span>{item.name}</span>
              <span>{item.color} · {item.size} · Qty {item.quantity}</span>
            </div>
          ))}
          <p className="muted">
            The backend will use current database prices, verify each variant's stock, and return your final total.
          </p>
        </aside>
      </div>
    </main>
  );
}
