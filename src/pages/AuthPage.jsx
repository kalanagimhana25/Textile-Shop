import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function AuthPage({ mode = "login", onLogin, onRegister }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (isRegister && (
      form.password.length < 10 ||
      new TextEncoder().encode(form.password).length > 72 ||
      !/[a-z]/.test(form.password) ||
      !/[A-Z]/.test(form.password) ||
      !/\d/.test(form.password)
    )) {
      setError("Use at least 10 characters with uppercase and lowercase letters and a number (maximum 72 bytes).");
      return;
    }
    if (isRegister && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isRegister && !form.password) {
      setError("Enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await onRegister?.({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
        navigate("/login", {
          replace: true,
          state: {
            message: "Account created. Please log in.",
            returnTo: location.state?.returnTo,
          },
        });
      } else {
        await onLogin?.({ email: form.email.trim(), password: form.password });
        const returnTo = location.state?.returnTo;
        navigate(
          typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")
            ? returnTo
            : "/",
          { replace: true }
        );
      }
    } catch (requestError) {
      setError(requestError.message || "We couldn't complete that request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="section shop-page">
      <div className="auth-card admin-form-card">
        <p className="eyebrow">{isRegister ? "JOIN DAYFORM" : "WELCOME BACK"}</p>
        <h1>{isRegister ? "Create your account" : "Sign in"}</h1>
        <p className="muted">
          {isRegister ? "Create a customer account to get started." : "Sign in to your account."}
        </p>
        <form className="admin-form auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              Full name
              <input
                name="fullName"
                value={form.fullName}
                onChange={updateForm}
                autoComplete="name"
                minLength={2}
                maxLength={120}
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateForm}
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateForm}
              autoComplete={isRegister ? "new-password" : "current-password"}
              maxLength={72}
              required
            />
          </label>
          {isRegister && (
            <label>
              Confirm password
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={updateForm}
                autoComplete="new-password"
                maxLength={72}
                required
              />
            </label>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="muted auth-switch">
          {isRegister ? "Already have an account?" : "New to DAYFORM?"}{" "}
          <Link to={isRegister ? "/login" : "/register"} state={location.state}>
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </main>
  );
}
