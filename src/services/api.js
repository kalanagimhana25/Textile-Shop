const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
const AUTH_STORAGE_KEY = "textile-auth-v1";

let unauthorizedHandler = () => {};

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : () => {};
}

export function readStoredAuth() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || "null");
    if (stored && typeof stored.token === "string" && stored.token) {
      return stored;
    }
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return null;
}

export function storeAuth(auth) {
  if (!auth?.token) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    token: auth.token,
    user: auth.user,
  }));
}

export async function apiRequest(path, { method = "GET", body, token, headers = {} } = {}) {
  if (!API_BASE_URL) {
    throw new Error("The API URL is not configured. Set VITE_API_URL in the frontend .env file.");
  }

  const savedAuth = readStoredAuth();
  const requestHeaders = new Headers(headers);
  if (body !== undefined) requestHeaders.set("Content-Type", "application/json");
  if (token || savedAuth?.token) {
    requestHeaders.set("Authorization", `Bearer ${token || savedAuth.token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the store server. Check your connection and try again.");
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    if (response.ok) {
      throw new Error("The store server returned an unexpected response.");
    }
  }

  if (!response.ok) {
    if (response.status === 401 && (token || savedAuth?.token)) {
      storeAuth(null);
      unauthorizedHandler();
    }

    const message = typeof payload.message === "string"
      ? payload.message
      : "The request could not be completed.";
    throw new Error(message);
  }

  return payload;
}

export function getApiErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "The request could not be completed. Please try again.";
}
