const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Remove type="module" and crossorigin from script tag, and remove the entire script from head
html = html.replace(
  /<script\s+type="module"\s+crossorigin\s+src="\.\/assets\/index\.js"><\/script>\s*/,
  ''
);

// Add script tag before closing body tag
html = html.replace(
  /<\/body>/,
  '    <script src="./assets/index.js"></script>\n  </body>'
);

// Add root div if not present
if (!html.includes('<div id="root"></div>')) {
  html = html.replace(
    /<body>/,
    '<body>\n    <div id="root"></div>'
  );
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✓ Fixed dist/index.html');

