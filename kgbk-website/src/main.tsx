import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Once a real logo.png is saved to /public, swap it in as the favicon
// automatically -- no code change needed. Falls back to favicon.svg (which
// always exists) until then, so the tab icon is never broken.
const probe = new Image();
probe.onload = () => {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link) link.href = "/logo.png";
  const touch = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (touch) touch.href = "/logo.png";
};
probe.src = "/logo.png";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
