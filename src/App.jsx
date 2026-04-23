import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import LegacyPage from "./LegacyPage";
import { legacyPageSet } from "./legacyPages";

const routeAliases = {
  "home-university": "index",
  home: "index"
};

function SlugPage() {
  const location = useLocation();
  const { slug } = useParams();
  const rawSlug = slug || "index";
  const strippedSlug = rawSlug.replace(/\.html$/i, "");
  const pageSlug = routeAliases[strippedSlug] || strippedSlug;
  const canonicalPath = pageSlug === "index" ? "/" : `/${pageSlug}`;

  if (location.pathname !== canonicalPath) {
    return <Navigate to={`${canonicalPath}${location.search}${location.hash}`} replace />;
  }

  if (!legacyPageSet.has(pageSlug)) {
    if (legacyPageSet.has("error")) {
      return <Navigate to="/error" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return <LegacyPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LegacyPage />} />
      <Route path="/:slug" element={<SlugPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
