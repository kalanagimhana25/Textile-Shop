import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const nextStatuses = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function Orders({ admin = false }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [updatingId, setUpdatingId] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0 });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const path = admin ? "/orders/admin" : "/orders/mine";
      const response = await apiRequest(`${path}?page=${page}&limit=20`);
      setOrders(response.data?.orders || []);
      setPagination(response.data?.pagination || { page, totalPages: 0 });
    } catch (requestError) {
      setError(requestError.message || "Orders could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [admin, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const updateStatus = async (order) => {
    const status = selectedStatuses[order._id];
    if (!status) return;
    setUpdatingId(order._id);
    setError("");
    try {
      const response = await apiRequest(`/orders/admin/${encodeURIComponent(order._id)}/status`, {
        method: "PATCH",
        body: { status },
      });
      setOrders((current) => current.map((item) =>
        item._id === order._id ? response.data.order : item
      ));
      setSelectedStatuses((current) => ({ ...current, [order._id]: "" }));
    } catch (requestError) {
      setError(requestError.message || "The order status could not be updated.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <main className="section">
      <p className="eyebrow">{admin ? "STORE MANAGEMENT" : "YOUR ACCOUNT"}</p>
      <h1>{admin ? "Customer orders" : "My orders"}</h1>
      <p className="muted">
        {admin ? "Review delivery details and update each order's progress." : "Review your order history and delivery status."}
      </p>

      {error && <p className="form-error" role="alert">{error}</p>}
      {loading && <p className="muted" role="status">Loading orders...</p>}
      {!loading && error && (
        <button type="button" className="secondary-button" onClick={loadOrders}>Try again</button>
      )}
      {!loading && !error && orders.length === 0 && (
        <div className="empty-cart order-empty-state">
          <p>{admin ? "No customer orders have been placed yet." : "You have not placed any orders yet."}</p>
          {!admin && <Link to="/shop" className="primary-button">Explore the collection</Link>}
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order._id}>
              <div className="order-card-heading">
                <div>
                  <p className="eyebrow">{order.orderNumber}</p>
                  <p className="muted">Placed {formatDate(order.createdAt)}</p>
                </div>
                <div className="order-card-total">
                  <span className="order-status">{order.status}</span>
                  <strong>Rs. {Number(order.total).toLocaleString()}</strong>
                </div>
              </div>

              {admin && (
                <div className="order-customer-summary">
                  <strong>{order.customer.fullName}</strong>
                  <span>{order.customer.email} · {order.customer.phone}</span>
                </div>
              )}

              <details className="order-details">
                <summary>View order details ({order.items.length} item{order.items.length === 1 ? "" : "s"})</summary>
                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div className="order-item" key={`${item.productId}-${item.color}-${item.size}-${index}`}>
                      {item.image && <img src={item.image} alt={item.productName} />}
                      <div>
                        <strong>{item.productName}</strong>
                        <span>{item.departmentName}{item.categoryName ? ` · ${item.categoryName}` : ""}</span>
                        <span>{item.color} · Size {item.size} · Quantity {item.quantity}</span>
                      </div>
                      <div className="order-item-price">
                        <span>Rs. {Number(item.unitPrice).toLocaleString()} each</span>
                        <strong>Rs. {Number(item.subtotal).toLocaleString()}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                {admin && (
                  <div className="order-delivery">
                    <h3>Delivery information</h3>
                    <p>{order.customer.fullName} · {order.customer.phone}</p>
                    <p>{order.deliveryAddress.line1}{order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ""}</p>
                    <p>
                      {[order.deliveryAddress.city, order.deliveryAddress.region, order.deliveryAddress.postalCode, order.deliveryAddress.country]
                        .filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
                <div className="order-totals">
                  <span>Items subtotal: Rs. {Number(order.subtotal).toLocaleString()}</span>
                  <span>Delivery: Rs. {Number(order.shippingCost).toLocaleString()}</span>
                  <strong>Total: Rs. {Number(order.total).toLocaleString()}</strong>
                </div>
              </details>

              {admin && nextStatuses[order.status]?.length > 0 && (
                <div className="order-status-controls">
                  <label>
                    Update status
                    <select
                      value={selectedStatuses[order._id] || ""}
                      onChange={(event) => setSelectedStatuses((current) => ({
                        ...current,
                        [order._id]: event.target.value,
                      }))}
                      disabled={updatingId === order._id}
                    >
                      <option value="">Choose next status</option>
                      {nextStatuses[order.status].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => updateStatus(order)}
                    disabled={!selectedStatuses[order._id] || updatingId === order._id}
                  >
                    {updatingId === order._id ? "Updating..." : "Save status"}
                  </button>
                </div>
              )}
            </article>
          ))}
          {pagination.totalPages > 1 && (
            <nav className="orders-pagination" aria-label="Order history pages">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <span>Page {page} of {pagination.totalPages}</span>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={page >= pagination.totalPages}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      )}
    </main>
  );
}
