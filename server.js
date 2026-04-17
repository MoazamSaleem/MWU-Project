const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = __dirname;

// Redirect `.html` URLs to clean extensionless routes.
app.use((req, res, next) => {
  // Only rewrite top-level page URLs like `/about.html`.
  // Do not rewrite nested asset paths like `/assets/partials/inner-header.html`.
  if (!/^\/[^/]+\.html$/.test(req.path)) {
    return next();
  }

  const cleanPath = req.path === '/index.html'
    ? '/'
    : req.path.replace(/\.html$/, '');

  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  return res.redirect(301, `${cleanPath}${query}`);
});

app.use(express.static(rootDir));

app.get('/', (_req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Serve extensionless pages dynamically (e.g., `/about` -> `about.html`).
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  const file = `${page}.html`;
  const filePath = path.join(rootDir, file);

  if (!fs.existsSync(filePath)) {
    return next();
  }

  return res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
