import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import Input from '../common/Input';
import PaymentProofUpload from './PaymentProofUpload';

const ManualPaymentForm = ({ method, transactionId, setTransactionId, proofFile, setProofFile }) => {
  const [copied, setCopied] = useState(false);

  if (method.id === 'cod') {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6 text-primary-dark">
        <h4 className="font-semibold mb-2">Cash on Delivery</h4>
        <p className="text-sm">You will pay when the delivery arrives at your doorstep. Please keep the exact amount ready.</p>
      </div>
    );
  }

  const handleCopy = () => {
    if (method.number) {
      navigator.clipboard.writeText(method.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const instructionAction = method.type === 'link' ? 'Open the official payment link' : 'Go to your payment app or menu';
  const targetLabel = method.type === 'link' ? 'payment link' : 'this number';

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
      <h4 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
        Pay via {method.name}
        {method.link && (
          <a 
            href={method.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-dark text-sm flex items-center gap-1"
          >
            Open Payment Link <ExternalLink size={16} />
          </a>
        )}
      </h4>

      <div className="bg-white border border-gray-100 rounded-lg p-4 mb-5 text-sm text-gray-700">
        <p className="mb-2">1. {instructionAction}.</p>
        <p className="mb-2 flex items-center gap-2 flex-wrap">
          2. Use <strong>Send Money</strong> or <strong>Payment</strong> to {targetLabel}:
          {method.number ? (
            <>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded font-bold text-gray-900 tracking-wider">
                {method.number}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors text-xs font-semibold"
              >
                {copied ? <><Check size={14}/> Copied</> : <><Copy size={14}/> Copy</>}
              </button>
            </>
          ) : (
            <span className="font-medium text-gray-900">{method.link}</span>
          )}
        </p>
        <p className="mb-2">3. Enter the exact total amount.</p>
        <p>4. Copy the Transaction ID (TrxID) and enter it below.</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Transaction ID (TrxID)"
          required
          placeholder="e.g. 9XBA4V9B"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          helpText="Found in your payment confirmation SMS or app."
        />
        
        <PaymentProofUpload 
          file={proofFile} 
          onUpload={(f) => setProofFile(f)} 
          onRemove={() => setProofFile(null)} 
        />
      </div>
    </div>
  );
};

export default ManualPaymentForm;
