import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { legacyPageSet } from "./legacyPages";

const STYLE_ATTR = "data-legacy-style";
const SCRIPT_ATTR = "data-legacy-script";
const STYLE_BATCH_ATTR = "data-legacy-style-batch";

const legacyAliases = {
  "home-university": "index",
  home: "index"
};

function normalizeScriptSrc(src) {
  try {
    return new URL(src, window.location.origin).toString();
  } catch {
    return src;
  }
}

function toRoutePath(href) {
  if (!href) return null;
  if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  if (href.startsWith("http://") || href.startsWith("https://")) return null;

  const [pathPart, hashPart] = href.split("#");
  const [pathname = "", query] = pathPart.split("?");

  const fileName = pathname.split("/").pop() || pathname;
  if (!fileName) return null;

  let slug = "";
  if (/\.html$/i.test(fileName)) {
    slug = fileName.replace(/\.html$/i, "");
  } else if (!fileName.includes(".")) {
    slug = fileName;
  } else {
    return null;
  }

  if (legacyAliases[slug]) {
    slug = legacyAliases[slug];
  }

  if (!legacyPageSet.has(slug)) {
    return null;
  }

  const baseRoute = slug === "index" ? "/" : `/${slug}`;
  const queryPart = query ? `?${query}` : "";
  const hash = hashPart ? `#${hashPart}` : "";

  return `${baseRoute}${queryPart}${hash}`;
}

function normalizeLegacyBodyHtml(html) {
  // Some legacy pages begin with an orphan closing div before the injected header mount.
  // Remove only leading stray closers so section layout is not broken.
  return (html || "").replace(/^\s*(<\/div>\s*)+/i, "");
}

function cleanupLegacyAssets() {
  document.querySelectorAll(`link[${STYLE_ATTR}], style[${STYLE_ATTR}]`).forEach((node) => node.remove());
  document.querySelectorAll(`script[${SCRIPT_ATTR}]`).forEach((node) => node.remove());
}

function cleanupLegacyScripts() {
  document.querySelectorAll(`script[${SCRIPT_ATTR}]`).forEach((node) => node.remove());
}

function waitForStylesheet(link) {
  return new Promise((resolve) => {
    // If already loaded from cache, `sheet` is often present immediately.
    if (link.sheet) {
      resolve();
      return;
    }

    const done = () => resolve();
    link.addEventListener("load", done, { once: true });
    link.addEventListener("error", done, { once: true });
    setTimeout(done, 3000);
  });
}

async function applyLegacyStyles(doc) {
  const batchId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const previousStyles = Array.from(
    document.querySelectorAll(`link[${STYLE_ATTR}], style[${STYLE_ATTR}]`)
  );
  const styleLoaders = [];

  doc.head.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
    const clone = node.cloneNode(true);
    clone.setAttribute(STYLE_ATTR, "true");
    clone.setAttribute(STYLE_BATCH_ATTR, batchId);
    document.head.appendChild(clone);

    if (clone.tagName === "LINK" && clone.getAttribute("rel")?.toLowerCase() === "stylesheet") {
      styleLoaders.push(waitForStylesheet(clone));
    }
  });

  await Promise.all(styleLoaders);
  previousStyles.forEach((node) => node.remove());
}

async function executeLegacyScripts(scripts) {
  for (const scriptDef of scripts) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.setAttribute(SCRIPT_ATTR, "true");

      if (scriptDef.type) {
        script.type = scriptDef.type;
      }

      if (scriptDef.src) {
        script.src = scriptDef.src;
        script.async = false;
        script.onload = resolve;
        script.onerror = reject;
      } else {
        script.textContent = scriptDef.content || "";
        resolve();
      }

      document.body.appendChild(script);
    }).catch(() => {
      // Keep rendering even if one script fails.
    });
  }
}

export default function LegacyPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [htmlContent, setHtmlContent] = useState("");

  const pageSlug = useMemo(() => {
    const normalized = slug && slug.trim() ? slug : "index";
    return legacyAliases[normalized] || normalized;
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      const targetSlug = pageSlug;
      const file = `/legacy/${targetSlug}.html`;

      try {
        const response = await fetch(file, { cache: "no-store" });
        if (!response.ok) {
          setHtmlContent("<main class='legacy-error'><h1>Page not found</h1></main>");
          return;
        }

        const source = await response.text();
        if (cancelled) return;

        const doc = new DOMParser().parseFromString(source, "text/html");

        document.title = doc.title || "MWU";
        await applyLegacyStyles(doc);

        const scripts = [];
        doc.querySelectorAll("script").forEach((script) => {
          const src = script.getAttribute("src");
          scripts.push({
            src: src ? normalizeScriptSrc(src) : "",
            type: script.getAttribute("type") || "",
            content: script.textContent || ""
          });
          script.remove();
        });

        const bodyHtml = doc.body ? doc.body.innerHTML : source;
        cleanupLegacyScripts();
        setHtmlContent(normalizeLegacyBodyHtml(bodyHtml));

        requestAnimationFrame(() => {
          executeLegacyScripts(scripts);
        });
      } catch {
        if (!cancelled) {
          setHtmlContent("<main class='legacy-error'><h1>Failed to load page</h1></main>");
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
      cleanupLegacyAssets();
    };
  }, [pageSlug]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const onClick = (event) => {
      const link = event.target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      const routePath = toRoutePath(href);
      if (!routePath) return;

      event.preventDefault();
      navigate(routePath);
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [navigate, location.pathname]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const rewriteAnchor = (anchor) => {
      const href = anchor.getAttribute("href");
      const routePath = toRoutePath(href);
      if (!routePath || href === routePath) return;
      anchor.setAttribute("href", routePath);
    };

    const rewriteNodeAnchors = (node) => {
      if (!(node instanceof Element)) return;
      if (node.matches("a[href]")) {
        rewriteAnchor(node);
      }
      node.querySelectorAll("a[href]").forEach((anchor) => rewriteAnchor(anchor));
    };

    rewriteNodeAnchors(root);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => rewriteNodeAnchors(node));
      });
    });

    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [htmlContent]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

