const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');

// Redirect top-level `.html` URLs to clean extensionless routes.
app.use((req, res, next) => {
  if (!/^\/[^/]+\.html$/.test(req.path)) {
    return next();
  }

  const cleanPath = req.path === '/index.html'
    ? '/'
    : req.path.replace(/\.html$/, '');

  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  return res.redirect(301, `${cleanPath}${query}`);
});

// Serve `public/*` files (legacy pages/assets) directly from root URL.
app.use(express.static(publicDir));
// Serve root-level files such as `index.html`.
app.use(express.static(rootDir, { index: false }));

// SPA fallback for React Router routes.
app.get('*', (_req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
