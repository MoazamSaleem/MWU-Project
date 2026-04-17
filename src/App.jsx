import { Navigate, Route, Routes, useParams } from "react-router-dom";
import LegacyPage from "./LegacyPage";
import { legacyPageSet } from "./legacyPages";

function SlugPage() {
  const { slug } = useParams();
  const pageSlug = slug || "index";

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
