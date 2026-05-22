import React, { useState } from 'react';
import { productImage } from '../../utils/apiData';

const GenericIllustration = ({ type }) => {
  const primaryGrad = "url(#primary-grad)";
  const tealGrad = "url(#teal-grad)";
  const trustGrad = "url(#trust-grad)";
  const whiteGrad = "url(#white-grad)";
  
  return (
    <svg className="w-2/3 h-2/3 transition-all duration-300 drop-shadow-md" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="teal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id="trust-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="white-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.08" />
        </filter>
      </defs>

      {type === 'tablet' && (
        <g filter="url(#shadow)">
          {/* Round Tablet 1 */}
          <circle cx="42" cy="58" r="22" fill={whiteGrad} stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M26.5 58 H57.5" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2 2" />
          
          {/* Round Tablet 2 (Primary Colored) */}
          <circle cx="62" cy="38" r="20" fill={primaryGrad} opacity="0.9" />
          <path d="M48 38 H76" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" />
        </g>
      )}

      {type === 'capsule' && (
        <g filter="url(#shadow)" transform="rotate(-30 50 50)">
          {/* Capsule Body */}
          <rect x="34" y="20" width="32" height="60" rx="16" fill="url(#white-grad)" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* Top Half colored */}
          <path d="M34 36 C34 26 40 20 50 20 C60 20 66 26 66 36 V50 H34 V36 Z" fill={primaryGrad} />
          {/* Capsule Band */}
          <rect x="32" y="48" width="36" height="4" rx="2" fill="#0D9488" />
        </g>
      )}

      {type === 'syrup' && (
        <g filter="url(#shadow)">
          {/* Medicine Bottle */}
          <path d="M38 32 C38 30 40 28 42 28 H58 C60 28 62 30 62 32 V36 H38 V32 Z" fill="#94A3B8" />
          <rect x="44" y="20" width="12" height="8" rx="2" fill={trustGrad} />
          <rect x="32" y="36" width="36" height="50" rx="8" fill="url(#white-grad)" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* Translucent liquid level inside */}
          <rect x="34" y="52" width="32" height="32" rx="4" fill={tealGrad} opacity="0.4" />
          {/* Generic Label - clean graphic, no text */}
          <rect x="38" y="44" width="24" height="16" rx="2" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="42" y1="49" x2="58" y2="49" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          <line x1="42" y1="53" x2="52" y2="53" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {type === 'injection' && (
        <g filter="url(#shadow)" transform="rotate(45 50 50)">
          {/* Syringe Plunger */}
          <rect x="48" y="5" width="4" height="30" fill="#94A3B8" />
          <rect x="42" y="5" width="16" height="3" rx="1" fill="#64748B" />
          
          {/* Syringe Body */}
          <rect x="42" y="30" width="16" height="45" rx="2" fill="url(#white-grad)" stroke="#94A3B8" strokeWidth="1.5" />
          {/* Liquid level */}
          <rect x="44" y="45" width="12" height="28" fill={primaryGrad} opacity="0.3" rx="1" />
          
          {/* Needle Hub */}
          <path d="M46 75 H54 L52 82 H48 L46 75 Z" fill="#64748B" />
          {/* Needle */}
          <line x1="50" y1="82" x2="50" y2="95" stroke="#94A3B8" strokeWidth="1.5" />
        </g>
      )}

      {type === 'cream' && (
        <g filter="url(#shadow)">
          {/* Squeezed Ointment Tube */}
          <path d="M35 80 L40 30 C40 28 42 26 45 26 H55 C58 26 60 28 60 30 L65 80 Z" fill="url(#white-grad)" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="44" y="20" width="12" height="6" rx="1" fill={primaryGrad} />
          {/* Tube bottom fold */}
          <rect x="33" y="78" width="34" height="4" rx="1" fill="#64748B" />
          {/* Generice green band on tube */}
          <path d="M38 50 L40 35 H60 L62 50 Z" fill={tealGrad} opacity="0.8" />
        </g>
      )}

      {type === 'drops' && (
        <g filter="url(#shadow)">
          {/* Dropper Bottle */}
          <rect x="44" y="20" width="12" height="12" rx="2" fill="#E2E8F0" stroke="#94A3B8" />
          <rect x="40" y="32" width="20" height="42" rx="6" fill="url(#white-grad)" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* Droplet falling */}
          <path d="M50 78 C50 78 44 84 44 88 C44 91.3 46.7 94 50 94 C53.3 94 56 91.3 56 88 C56 84 50 78 50 78 Z" fill={trustGrad} />
        </g>
      )}

      {type === 'device' && (
        <g filter="url(#shadow)">
          {/* Clean Medical Cross & Heart Rate representing equipment */}
          <rect x="25" y="25" width="50" height="50" rx="12" fill="url(#white-grad)" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M50 35 V65 M35 50 H65" stroke={trustGrad} strokeWidth="8" strokeLinecap="round" />
          <path d="M38 65 H62" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {type === 'baby' && (
        <g filter="url(#shadow)">
          {/* Baby Care Feeding Bottle */}
          <rect x="45" y="20" width="10" height="12" fill="#F59E0B" opacity="0.8" rx="2" />
          <rect x="36" y="32" width="28" height="48" rx="6" fill="url(#white-grad)" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="42" y1="42" x2="52" y2="42" stroke="#CBD5E1" strokeWidth="2" />
          <line x1="42" y1="48" x2="48" y2="48" stroke="#CBD5E1" strokeWidth="2" />
          <line x1="42" y1="54" x2="52" y2="54" stroke="#CBD5E1" strokeWidth="2" />
          <circle cx="50" cy="65" r="6" fill="#F472B6" opacity="0.6" />
        </g>
      )}

      {type === 'generic' && (
        <g filter="url(#shadow)">
          {/* Clean Medical Shield & Cross */}
          <path d="M50 20 C65 20 75 25 75 35 C75 60 50 80 50 80 C50 80 25 60 25 35 C25 25 35 20 50 20 Z" fill="url(#white-grad)" stroke="#CBD5E1" strokeWidth="2" />
          <path d="M50 35 V55 M40 45 H60" stroke={primaryGrad} strokeWidth="6" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

const getFallbackType = (product) => {
  if (!product) return 'generic';
  
  const dosage = (product.dosageForm || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  
  if (dosage.includes('tablet')) return 'tablet';
  if (dosage.includes('capsule')) return 'capsule';
  if (dosage.includes('syrup') || dosage.includes('suspension')) return 'syrup';
  if (dosage.includes('injection') || dosage.includes('vial') || dosage.includes('ampoule')) return 'injection';
  if (dosage.includes('cream') || dosage.includes('ointment') || dosage.includes('gel')) return 'cream';
  if (dosage.includes('drop') || dosage.includes('drops') || dosage.includes('ophthalmic') || dosage.includes('nasal')) return 'drops';
  if (category.includes('device') || category.includes('equipment') || category.includes('surgical')) return 'device';
  if (category.includes('baby') || category.includes('child')) return 'baby';
  
  return 'generic';
};

const ProductImage = ({ product, alt = product?.name || 'Product image', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const src = productImage(product);
  
  // If there's no src or it errored out, show the elegant light illustration
  if (!src || imgError || src.includes('favicon.svg')) {
    const type = getFallbackType(product);
    return (
      <div className={`bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-xl flex items-center justify-center overflow-hidden border border-emerald-500/10 shadow-inner ${className}`}>
        <GenericIllustration type={type} />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain p-2 hover:scale-105 transition-all duration-300"
        onError={() => setImgError(true)}
      />
    </div>
  );
};

export default ProductImage;
