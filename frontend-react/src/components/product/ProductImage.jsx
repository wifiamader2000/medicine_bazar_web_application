import React, { useState } from 'react';
import { productImage } from '../../utils/apiData';
import { Pill, Activity, Syringe, TestTube, Baby, Droplet, Wind, Box, HeartPulse, Shield } from 'lucide-react';

const getFallbackIcon = (product) => {
  if (!product) return <Box className="w-1/2 h-1/2 text-gray-300 drop-shadow-md" />;
  
  const dosage = (product.dosageForm || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  
  // 3D Glassy Icon configurations
  const iconProps = {
    className: "w-1/2 h-1/2 text-teal-600 drop-shadow-lg opacity-80",
    strokeWidth: 1.5
  };
  
  if (dosage.includes('tablet') || dosage.includes('capsule')) return <Pill {...iconProps} />;
  if (dosage.includes('syrup') || dosage.includes('suspension')) return <Droplet {...iconProps} />;
  if (dosage.includes('injection') || dosage.includes('vaccine')) return <Syringe {...iconProps} />;
  if (dosage.includes('cream') || dosage.includes('ointment')) return <Activity {...iconProps} />;
  if (dosage.includes('drop')) return <Droplet {...iconProps} />;
  if (dosage.includes('inhaler')) return <Wind {...iconProps} />;
  if (category.includes('device') || category.includes('equipment')) return <HeartPulse {...iconProps} />;
  if (category.includes('baby')) return <Baby {...iconProps} />;
  if (category.includes('condom') || category.includes('personal')) return <Shield {...iconProps} />;
  if (category.includes('test') || category.includes('lab')) return <TestTube {...iconProps} />;
  
  return <Box {...iconProps} />;
};

const ProductImage = ({ product, alt = product?.name || 'Product image', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const src = productImage(product);
  
  // If there's no src or it errored out, show the 3D fallback
  if (!src || imgError || src.includes('favicon.svg')) {
    return (
      <div className={`bg-gradient-to-br from-gray-50 to-teal-50 rounded flex items-center justify-center overflow-hidden border border-white/50 shadow-inner ${className}`}>
        {getFallbackIcon(product)}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded flex items-center justify-center overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  );
};

export default ProductImage;
