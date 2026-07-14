import { useEffect, useRef, useState } from "react";

import { loginAccount, loginWithGoogle, registerAccount } from "../api/auth";
import "./Auth.css";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return undefined;

    let isActive = true;

    function renderGoogleButton() {
      if (!isActive || !window.google || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!credential) return;

          try {
            setError("");
            setIsSubmitting(true);
            const response = await loginWithGoogle(credential);
            onAuthenticated(response.data.user);
          } catch (requestError) {
            setError(requestError.response?.data?.message || "Google login failed. Please try again.");
          } finally {
            setIsSubmitting(false);
          }
        },
      });

      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width: googleButtonRef.current.clientWidth,
      });
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (window.google) {
      renderGoogleButton();
    } else if (existingScript) {
      existingScript.addEventListener("load", renderGoogleButton, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderGoogleButton, { once: true });
      script.addEventListener("error", () => {
        if (isActive) setError("Google login could not be loaded.");
      }, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      isActive = false;
      existingScript?.removeEventListener("load", renderGoogleButton);
    };
  }, [onAuthenticated]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (mode === "register" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = mode === "register"
        ? await registerAccount({ name: name.trim(), email: email.trim(), password })
        : await loginAccount({ email: email.trim(), password });

      onAuthenticated(response.data.user);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to continue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-introduction">
          <span className="auth-logo" aria-hidden="true">A</span>
          <p>Inventory and accounting workspace</p>
          <h1>Keep your business organized.</h1>
          <span>Manage products, invoices, customers, transactions, and profit securely in one place.</span>
        </div>

        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => switchMode("register")}
            >
              Register
            </button>
          </div>

          <div className="auth-heading">
            <p>{mode === "login" ? "Welcome back" : "Create your workspace"}</p>
            <h2>{mode === "login" ? "Login to your account" : "Register a new account"}</h2>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          {googleClientId && (
            <>
              <div className="auth-google-button" ref={googleButtonRef} />
              <div className="auth-divider"><span>or use email</span></div>
            </>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <label>
                <span>Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Your name"
                />
              </label>
            )}

            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={255}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>

            <label>
              <span>Password</span>
              <div className="auth-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="At least 8 characters"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait..."
                : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Auth;
