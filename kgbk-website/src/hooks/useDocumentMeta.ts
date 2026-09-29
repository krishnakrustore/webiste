import { useEffect } from "react";

interface ExtraMeta {
  /** Absolute image URL for social previews. */
  image?: string;
  /** schema.org structured data, rendered as JSON-LD. */
  jsonLd?: Record<string, unknown>;
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/** Sets title, description, social tags and structured data for the current route (client-side SEO). */
export function useDocumentMeta(title: string, description?: string, extra?: ExtraMeta) {
  const jsonLd = extra?.jsonLd ? JSON.stringify(extra.jsonLd) : "";
  const image = extra?.image;

  useEffect(() => {
    document.title = title;
    setMeta("property", "og:title", title);
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
    }
    if (image) setMeta("property", "og:image", image);

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = jsonLd;
      document.head.appendChild(script);
    }

    return () => {
      script?.remove();
    };
  }, [title, description, image, jsonLd]);
}
