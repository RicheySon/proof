import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

const CONSENT_COOKIE = "proof_consent";
const ANALYTICS_ID = "proof-plausible"; // swapped when VITE_PUBLIC_ANALYTICS_DOMAIN is set — server injects via meta

function readConsent(): "essential" | "analytics" | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )proof_consent=([^;]*)/);
  const value = match?.[1];
  if (value === "analytics" || value === "essential") return value;
  return null;
}

function writeConsent(value: "essential" | "analytics") {
  const maxAge = 60 * 60 * 24 * 180;
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
}

function loadAnalytics() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANALYTICS_ID)) return;
  const domain = (import.meta as { env?: Record<string, string> }).env?.VITE_PUBLIC_ANALYTICS_DOMAIN;
  if (!domain) {
    // Lightweight first-party beacon — no third-party cookie until domain configured.
    void fetch("/api/v1/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer || null,
        ts: Date.now(),
      }),
      keepalive: true,
    }).catch(() => undefined);
    return;
  }
  const script = document.createElement("script");
  script.id = ANALYTICS_ID;
  script.defer = true;
  script.setAttribute("data-domain", domain);
  script.src = "https://plausible.io/js/script.js";
  document.head.appendChild(script);
}

/**
 * Cookie consent: essential session cookie always allowed.
 * Optional analytics only after explicit accept.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      setVisible(true);
      return;
    }
    if (existing === "analytics") loadAnalytics();
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner__copy">
        <strong>Cookies</strong>
        <p>
          We use a necessary signed session cookie so your receipts stay in your workspace. Optional
          analytics (anonymous page views) stay off until you accept.{" "}
          <Link to="/privacy">Privacy</Link>
        </p>
      </div>
      <div className="cookie-banner__actions">
        <Button
          variant="outline"
          onClick={() => {
            writeConsent("essential");
            setVisible(false);
          }}
        >
          Essential only
        </Button>
        <Button
          onClick={() => {
            writeConsent("analytics");
            loadAnalytics();
            setVisible(false);
          }}
        >
          Accept analytics
        </Button>
      </div>
    </div>
  );
}
