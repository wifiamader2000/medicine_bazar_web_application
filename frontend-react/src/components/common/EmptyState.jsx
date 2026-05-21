import React from 'react';
import { Search } from 'lucide-react';

const EmptyState = ({ title = 'Nothing found', description = 'There is no data to show yet.', action = null }) => {
  return (
    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
      <div className="text-gray-300 mb-4 flex justify-center">
        <Search size={56} />
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
