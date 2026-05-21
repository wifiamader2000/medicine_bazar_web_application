import React from 'react';
import { productImage } from '../../utils/apiData';

const ProductImage = ({ product, alt = product?.name || 'Product image', className = '' }) => {
  return (
    <div className={`bg-gray-50 rounded flex items-center justify-center overflow-hidden ${className}`}>
      <img
        src={productImage(product)}
        alt={alt}
        className="h-full w-full object-contain"
        onError={(event) => { event.currentTarget.src = '/favicon.svg'; }}
      />
    </div>
  );
};

export default ProductImage;
