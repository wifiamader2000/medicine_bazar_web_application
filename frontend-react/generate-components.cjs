const fs = require('fs');
const path = require('path');

const components = {
  'common': [
    'Button.jsx', 'Card.jsx', 'Badge.jsx', 'Input.jsx', 'Select.jsx', 
    'Modal.jsx', 'Loading.jsx', 'EmptyState.jsx', 'ErrorState.jsx', 
    'SectionHeader.jsx', 'PageHeader.jsx', 'StatCard.jsx', 
    'DataTable.jsx', 'Pagination.jsx', 'Tabs.jsx', 'Toast.jsx'
  ],
  'product': [
    'ProductCard.jsx', 'ProductGrid.jsx', 'ProductFilters.jsx', 
    'ProductPrice.jsx', 'PrescriptionBadge.jsx', 'StockBadge.jsx', 
    'ProductImage.jsx'
  ],
  'search': [
    'SearchBar.jsx', 'SearchOverlay.jsx', 'SearchSuggestionItem.jsx', 
    'SearchFilters.jsx'
  ],
  'payment': [
    'PaymentMethodCard.jsx', 'ManualPaymentForm.jsx', 'PaymentProofUpload.jsx'
  ],
  'admin': [
    'AdminSidebar.jsx', 'AdminTopbar.jsx', 'AdminStatGrid.jsx', 'AdminTaskCenter.jsx'
  ],
  'pos': [
    'POSSearch.jsx', 'POSCart.jsx', 'POSPaymentPanel.jsx', 'POSReceipt.jsx'
  ]
};

Object.keys(components).forEach(folder => {
  const dirPath = path.join(__dirname, 'src', 'components', folder);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  components[folder].forEach(file => {
    const filePath = path.join(dirPath, file);
    if (!fs.existsSync(filePath)) {
      const componentName = path.basename(file, '.jsx');
      const content = `import React from 'react';

const ${componentName} = (props) => {
  return (
    <div className="">
      {/* ${componentName} Content */}
    </div>
  );
};

export default ${componentName};
`;
      fs.writeFileSync(filePath, content);
      console.log('Created', filePath);
    }
  });
});
