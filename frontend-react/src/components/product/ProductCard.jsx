import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import {
  addProductToCart,
  formatPrice,
  productImage,
  productPrice,
  productRequiresPrescription,
  productRouteId,
} from '../../utils/apiData';

import ProductImage from './ProductImage';

const ProductCard = ({ product }) => {
  const { name, nameBn, genericName, strength, manufacturer, mrp, discount } = product;
  const { language, t } = useLanguage();
  const routeId = productRouteId(product);
  const detailPath = routeId ? `/product/${routeId}` : '/shop';
  const requiresPrescription = productRequiresPrescription(product);
  const price = productPrice(product);

  const displayName = language === 'bn' && nameBn ? nameBn : name;

  return (
    <Card hover className="flex flex-col h-full relative group overflow-hidden p-4">
      {requiresPrescription && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="danger" className="text-[10px] px-2.5 py-0.5 font-bold shadow-sm">Rx Only</Badge>
        </div>
      )}

      <Link to={detailPath} className="block flex-shrink-0 relative pt-[100%] rounded-[18px] mb-4 overflow-hidden">
        <ProductImage
          product={product}
          alt={displayName}
          className="absolute inset-0 w-full h-full transform group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      <div className="flex-1 flex flex-col">
        <Link to={detailPath} className="hover:text-[var(--color-primary)] transition-colors">
          <h3 className="font-bold text-slate-800 leading-snug mb-1 line-clamp-2 text-sm sm:text-base">
            {displayName} {strength && <span className="text-slate-500 font-normal text-xs sm:text-sm">({strength})</span>}
          </h3>
        </Link>
        <p className="text-xs text-slate-400 mb-1 truncate font-medium">{genericName}</p>
        <p className="text-[11px] text-slate-400 mb-3 truncate font-semibold uppercase tracking-wider">{manufacturer?.name || manufacturer}</p>

        <div className="mt-auto pt-2 border-t border-slate-100/60">
          <div className="flex items-end gap-2 mb-3">
            <span className="text-lg font-extrabold text-[var(--color-primary)]">{formatPrice(price)}</span>
            {discount > 0 && (
              <>
                <span className="text-xs text-slate-400 line-through mb-0.5">{formatPrice(mrp)}</span>
                <Badge variant="offer" className="ml-auto text-[10px] px-2 py-0.5">-{discount}%</Badge>
              </>
            )}
          </div>

          <Button
            fullWidth
            variant="primary"
            size="sm"
            className="mt-auto font-bold"
            onClick={() => addProductToCart(product)}
          >
            {t('common.addToCart')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
