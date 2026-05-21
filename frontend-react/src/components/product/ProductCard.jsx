import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import {
  addProductToCart,
  formatPrice,
  productImage,
  productPrice,
  productRequiresPrescription,
  productRouteId,
} from '../../utils/apiData';

const ProductCard = ({ product }) => {
  const { name, genericName, strength, manufacturer, mrp, discount } = product;
  const routeId = productRouteId(product);
  const detailPath = routeId ? `/product/${routeId}` : '/shop';
  const requiresPrescription = productRequiresPrescription(product);
  const price = productPrice(product);

  return (
    <Card hover className="flex flex-col h-full relative group">
      {requiresPrescription && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="alert" className="text-[10px]">Rx</Badge>
        </div>
      )}

      <Link to={detailPath} className="block flex-shrink-0 relative pt-[100%] bg-gray-50 rounded mb-3 overflow-hidden">
        <img
          src={productImage(product)}
          alt={name}
          className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
          onError={(event) => { event.currentTarget.src = '/favicon.svg'; }}
        />
      </Link>

      <div className="flex-1 flex flex-col">
        <Link to={detailPath} className="hover:text-[var(--color-primary)]">
          <h3 className="font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">
            {name} <span className="text-gray-500 font-normal">{strength}</span>
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mb-1 truncate">{genericName}</p>
        <p className="text-xs text-gray-500 mb-2 truncate">{manufacturer?.name || manufacturer}</p>

        <div className="mt-auto">
          <div className="flex items-end gap-2 mb-3">
            <span className="text-lg font-bold text-[var(--color-primary)]">{formatPrice(price)}</span>
            {discount > 0 && (
              <>
                <span className="text-sm text-gray-400 line-through">{formatPrice(mrp)}</span>
                <Badge variant="offer" className="ml-auto">-{discount}%</Badge>
              </>
            )}
          </div>

          <Button
            fullWidth
            variant="outline"
            size="sm"
            className="mt-auto group-hover:bg-[var(--color-primary)] group-hover:text-white"
            onClick={() => addProductToCart(product)}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
