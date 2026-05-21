const fs = require('fs');
const path = require('path');

const files = [
  // Layouts
  'layouts/PublicLayout.jsx',
  'layouts/CustomerLayout.jsx',
  'layouts/AdminLayout.jsx',
  'layouts/POSLayout.jsx',
  
  // Public Pages
  'pages/public/Home.jsx',
  'pages/public/Shop.jsx',
  'pages/public/Search.jsx',
  'pages/public/ProductDetail.jsx',
  'pages/public/Category.jsx',
  'pages/public/Brand.jsx',
  'pages/public/NotFound.jsx',

  // Auth Pages
  'pages/auth/Login.jsx',

  // Customer Pages
  'pages/customer/Dashboard.jsx',

  // Admin Pages
  'pages/admin/AdminDashboard.jsx',
  'pages/admin/ProductsManager.jsx',

  // POS
  'pages/pos/POSPage.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, 'src', file);
  const componentName = path.basename(file, '.jsx');
  
  let content = `import React from 'react';\n\nconst ${componentName} = () => {\n  return (\n    <div className="p-4">\n      <h1 className="text-2xl font-bold">${componentName}</h1>\n    </div>\n  );\n};\n\nexport default ${componentName};\n`;

  if (file.includes('Layout')) {
    content = `import React from 'react';\nimport { Outlet } from 'react-router-dom';\n\nconst ${componentName} = () => {\n  return (\n    <div className="min-h-screen flex flex-col">\n      <header className="bg-primary text-white p-4 font-bold text-xl">${componentName}</header>\n      <main className="flex-1 bg-background">\n        <Outlet />\n      </main>\n    </div>\n  );\n};\n\nexport default ${componentName};\n`;
  }

  fs.writeFileSync(filePath, content);
  console.log('Created', filePath);
});
