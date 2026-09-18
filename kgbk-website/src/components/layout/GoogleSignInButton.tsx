import { useEffect, useRef, useState } from "react";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { ApiError } from "../../api/client";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function GoogleSignInButton() {
  const { loginWithGoogle } = useCustomerAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!CLIENT_ID || !buttonRef.current) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (resp) => {
            try {
              await loginWithGoogle(resp.credential);
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Google sign-in failed. Please try again.");
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: 320,
          text: "continue_with",
        });
      })
      .catch(() => setError("Could not load Google Sign-In."));

    return () => { cancelled = true; };
  }, [loginWithGoogle]);

  if (!CLIENT_ID) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={buttonRef} className="flex justify-center" />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
