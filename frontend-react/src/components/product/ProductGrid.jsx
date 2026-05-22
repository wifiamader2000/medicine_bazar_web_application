import React from 'react';
import EmptyState from '../common/EmptyState';
import ProductCard from './ProductCard';

const ProductGrid = ({ products = [], className = '' }) => {
  if (!products.length) {
    return <EmptyState title="No products found" description="Try changing your search or filters." />;
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 ${className}`}>
      {products.map((product) => (
        <ProductCard key={product.id || product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
