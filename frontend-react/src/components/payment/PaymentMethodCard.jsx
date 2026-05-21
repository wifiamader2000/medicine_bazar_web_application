import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const PaymentMethodCard = ({ method, isSelected, onSelect }) => {
  return (
    <div 
      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-200 bg-white hover:border-primary/50'
      }`}
      onClick={() => onSelect(method.id)}
    >
      {isSelected && (
        <div className="absolute -right-2 -top-2 rounded-full bg-white text-primary">
          <CheckCircle2 className="h-6 w-6 fill-white" />
        </div>
      )}
      
      <div className="flex items-center gap-4">
        {/* Method Icon / Logo Placeholder */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-500">
          {method.icon || method.name.substring(0, 2).toUpperCase()}
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900">{method.name}</h4>
          {method.description && (
            <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodCard;
