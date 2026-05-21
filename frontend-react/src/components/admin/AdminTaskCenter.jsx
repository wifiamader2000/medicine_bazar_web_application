import React from 'react';
import { AlertCircle, FileText, Package, CheckCircle, RefreshCcw, ShieldAlert } from 'lucide-react';
import Button from '../common/Button';

const AdminTaskCenter = ({ stats }) => {
  const tasks = [
    { 
      id: 1, 
      title: 'Pending Manual Payments', 
      count: stats?.pendingPaymentVerification || 0, 
      icon: ShieldAlert, 
      color: 'text-orange-600', 
      bg: 'bg-orange-100',
      action: 'Verify Now'
    },
    { 
      id: 2, 
      title: 'Pending Prescriptions', 
      count: stats?.pendingPrescriptions || 0, 
      icon: FileText, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      action: 'Review'
    },
    { 
      id: 3, 
      title: 'Low Stock Alerts', 
      count: stats?.lowStock || 0, 
      icon: Package, 
      color: 'text-red-600', 
      bg: 'bg-red-100',
      action: 'Restock'
    },
    { 
      id: 4, 
      title: 'Refund Requests', 
      count: stats?.refundRequests || 0, 
      icon: RefreshCcw, 
      color: 'text-purple-600', 
      bg: 'bg-purple-100',
      action: 'Process'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Task Center</h2>
        <p className="text-sm text-gray-500">Requires your immediate attention</p>
      </div>
      <div className="divide-y divide-gray-50">
        {tasks.map(task => {
          const Icon = task.icon;
          return (
            <div key={task.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${task.bg} ${task.color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{task.title}</h4>
                  <p className="text-sm text-gray-500">
                    {task.count === 0 ? 'No pending tasks' : `${task.count} items waiting`}
                  </p>
                </div>
              </div>
              {task.count > 0 ? (
                <Button variant="outline" size="sm" className="whitespace-nowrap">
                  {task.action}
                </Button>
              ) : (
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <CheckCircle size={14} /> Clear
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTaskCenter;
