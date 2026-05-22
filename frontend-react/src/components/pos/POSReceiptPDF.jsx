import React, { useRef, useState } from 'react';
import { Printer, Download, X, MessageSquare, ReceiptText } from 'lucide-react';
import { formatPrice } from '../../utils/apiData';

/**
 * POSReceiptPDF — Professional thermal receipt overlay
 *
 * Renders a receipt in 80mm thermal-printer-friendly layout.
 * Features: print, PDF download (via print-to-PDF), WhatsApp share, close.
 * Does NOT depend on any external PDF library — uses native window.print().
 */
const POSReceiptPDF = ({ order, onClose }) => {
  const receiptRef = useRef(null);
  const [paperSize, setPaperSize] = useState('80mm'); // '58mm' or '80mm'

  if (!order) return null;

  const invoiceNumber = order.invoiceNumber || order.orderNumber || order.id || order._id || '';
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const items = order.items || [];
  const subtotal = order.subtotal || 0;
  const discount = order.discount || 0;
  const total = order.total || 0;
  const paymentMethod = (order.paymentMethod || 'cash').toUpperCase();
  const cashierName = order.cashierName || 'Staff';
  const customerPhone = order.customerPhone || '';
  const tenderedAmount = order.tenderedAmount || null;
  const change = order.change || null;
  const dueAmount = order.dueAmount || 0;
  const refunded = order.refunded || false;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=400,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Receipt - ${invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; }
        .receipt { width: ${paperSize === '58mm' ? '58mm' : '80mm'}; margin: 0 auto; padding: 4mm; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .item-name { max-width: 55%; overflow: hidden; text-overflow: ellipsis; }
        .item-qty { text-align: center; width: 15%; }
        .item-total { text-align: right; width: 30%; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 2px 0; font-size: 11px; }
        th { text-align: left; border-bottom: 1px dashed #000; }
        .total-row { font-size: 14px; font-weight: bold; }
        .footer { margin-top: 12px; font-size: 10px; text-align: center; }
        .qr-placeholder { width: 50px; height: 50px; margin: 8px auto; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 8px; }
        @media print { body { margin: 0; } .receipt { width: 100%; } }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const handleDownloadPDF = () => {
    // Uses browser's Print-to-PDF feature
    handlePrint();
  };

  const whatsappNumber = '8801602444532';
  const whatsappText = encodeURIComponent(
    `Medicine Bazar Receipt\nInvoice: ${invoiceNumber}\nTotal: ${formatPrice(total)}\nPayment: ${paymentMethod}\nDate: ${createdAt.toLocaleString()}`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  const maxWidth = paperSize === '58mm' ? 'max-w-[58mm]' : 'max-w-[80mm]';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ReceiptText size={22} />
            <div>
              <h2 className="text-lg font-bold">POS Receipt</h2>
              <p className="text-slate-300 text-xs">{invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Paper Size Toggle */}
        <div className="px-6 pt-4 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Paper:</span>
          {['58mm', '80mm'].map((size) => (
            <button
              key={size}
              onClick={() => setPaperSize(size)}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                paperSize === size
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Receipt Preview */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className={`bg-white border border-slate-200 rounded-lg shadow-inner ${maxWidth} mx-auto`}>
            <div ref={receiptRef} className="receipt p-4 font-mono text-xs text-black leading-relaxed">
              {/* Store Header */}
              <div className="center mb-3">
                <div className="bold" style={{ fontSize: '16px' }}>MEDICINE BAZAR</div>
                <div style={{ fontSize: '10px' }}>মেডিসিন বাজার</div>
                <div style={{ fontSize: '9px', marginTop: '2px' }}>Your Trusted Pharmacy Partner</div>
                <div style={{ fontSize: '9px' }}>Phone: 01602444532</div>
              </div>

              <div className="divider" />

              {/* Invoice Info */}
              <div style={{ margin: '4px 0' }}>
                <div className="row"><span>Invoice:</span><span className="bold">{invoiceNumber}</span></div>
                <div className="row"><span>Date:</span><span>{createdAt.toLocaleDateString('en-GB')}</span></div>
                <div className="row"><span>Time:</span><span>{createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div className="row"><span>Cashier:</span><span>{cashierName}</span></div>
                {customerPhone && <div className="row"><span>Customer:</span><span>{customerPhone}</span></div>}
              </div>

              <div className="divider" />

              {/* Items Table */}
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', width: '50%' }}>Item</th>
                    <th style={{ textAlign: 'center', width: '15%' }}>Qty</th>
                    <th style={{ textAlign: 'right', width: '15%' }}>Rate</th>
                    <th style={{ textAlign: 'right', width: '20%' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ paddingTop: '4px', paddingBottom: '4px' }}>
                        <div className="bold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: paperSize === '58mm' ? '90px' : '130px' }}>
                          {item.name}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', paddingTop: '4px' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', paddingTop: '4px' }}>{(item.price || 0).toFixed(0)}</td>
                      <td style={{ textAlign: 'right', paddingTop: '4px' }}>{(item.total || (item.price * item.quantity) || 0).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="divider" />

              {/* Totals */}
              <div style={{ margin: '4px 0' }}>
                <div className="row"><span>Subtotal:</span><span>{formatPrice(subtotal)}</span></div>
                {discount > 0 && (
                  <div className="row"><span>Discount:</span><span>-{formatPrice(discount)}</span></div>
                )}
                <div className="divider" />
                <div className="row total-row" style={{ margin: '4px 0' }}>
                  <span>TOTAL:</span><span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div style={{ margin: '4px 0' }}>
                <div className="row"><span>Payment:</span><span>{paymentMethod}</span></div>
                
                {dueAmount > 0 ? (
                  <>
                    <div className="row bold" style={{ color: '#dc2626' }}>
                      <span>DUE AMOUNT:</span><span>{formatPrice(dueAmount)}</span>
                    </div>
                    <div className="row"><span>PAID TODAY:</span><span>{formatPrice(order.paidAmount || 0)}</span></div>
                  </>
                ) : (
                  <>
                    {tenderedAmount != null && tenderedAmount > 0 && (
                      <>
                        <div className="row"><span>Tendered:</span><span>{formatPrice(tenderedAmount)}</span></div>
                        {change != null && change > 0 && (
                          <div className="row"><span>Change:</span><span>{formatPrice(change)}</span></div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Refund Note */}
              {refunded && (
                <>
                  <div className="divider" />
                  <div className="center bold" style={{ color: '#dc2626', margin: '4px 0' }}>
                    *** REFUNDED ***
                  </div>
                </>
              )}

              <div className="divider" />

              {/* QR Placeholder */}
              <div className="qr-placeholder">
                <span style={{ fontSize: '7px', textAlign: 'center' }}>{invoiceNumber}</span>
              </div>

              {/* Footer */}
              <div className="footer">
                <div className="bold">Thank you for visiting!</div>
                <div>আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ!</div>
                <div style={{ marginTop: '4px' }}>Please retain receipt for returns/exchanges.</div>
                <div style={{ marginTop: '6px', fontSize: '8px', color: '#999' }}>Powered by Medicine Bazar POS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 grid grid-cols-3 gap-3">
          <button
            onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Printer size={20} />
            <span className="text-xs">Print</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex flex-col items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Download size={20} />
            <span className="text-xs">Save PDF</span>
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <MessageSquare size={20} />
            <span className="text-xs">WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default POSReceiptPDF;
