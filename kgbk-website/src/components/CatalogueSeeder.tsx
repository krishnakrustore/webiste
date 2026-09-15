import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

// Confirms the backend is reachable before rendering the app, so a stopped
// server shows a clear message instead of the site silently breaking.
export default function CatalogueSeeder({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "ok" | "unreachable">("checking");

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => setStatus(res.ok ? "ok" : "unreachable"))
      .catch(() => setStatus("unreachable"));
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <p className="font-display text-2xl text-wine animate-pulse">Krishna Gari Battala Kottu</p>
      </div>
    );
  }

  if (status === "unreachable") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory px-5">
        <div className="max-w-md text-center">
          <p className="font-display text-2xl text-wine mb-3">Can&rsquo;t reach the server</p>
          <p className="text-sm text-charcoal/60 leading-relaxed">
            The website couldn&rsquo;t connect to the backend API at <code className="bg-beige/50 px-1.5 py-0.5 rounded">{API_URL}</code>.
            Make sure the server is running (<code className="bg-beige/50 px-1.5 py-0.5 rounded">npm run dev</code> inside the{" "}
            <code className="bg-beige/50 px-1.5 py-0.5 rounded">server</code> folder), then reload this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
