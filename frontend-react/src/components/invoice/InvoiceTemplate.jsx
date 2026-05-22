import React, { useRef } from 'react';
import { Printer, Download, X, MessageSquare, FileText } from 'lucide-react';
import { formatPrice } from '../../utils/apiData';

/**
 * InvoiceTemplate — A4 professional invoice for online orders
 *
 * Features: Medicine Bazar header, customer info, delivery address,
 * order number, itemized list, subtotal/delivery/discount/total,
 * payment status, order status, medical disclaimer, print/download.
 *
 * No external PDF library — uses native window.print().
 */
const InvoiceTemplate = ({ order, onClose }) => {
  const invoiceRef = useRef(null);

  if (!order) return null;

  const orderNumber = order.orderNumber || order.invoiceNumber || order.id || '';
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const items = order.items || [];
  const subtotal = order.subtotal || 0;
  const discount = order.discount || 0;
  const deliveryCharge = order.deliveryCharge || 0;
  const total = order.total || 0;
  const paymentMethod = order.paymentMethod || 'cod';
  const paymentStatus = order.paymentStatus || 'pending';
  const orderStatus = order.orderStatus || 'pending';
  const shippingAddress = order.shippingAddress || null;
  const customerName = order.customerName || shippingAddress?.name || '';
  const customerEmail = order.customerEmail || '';
  const note = order.note || '';

  const paymentLabel = {
    cod: 'Cash On Delivery',
    bkash: 'bKash',
    nagad: 'Nagad',
    upay: 'Upay',
    cash: 'Cash',
    card: 'Card',
    sslcommerz: 'SSLCommerz',
  }[paymentMethod] || paymentMethod;

  const statusLabel = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    pending_verification: 'Awaiting Verification',
    verified: 'Verified',
    paid: 'Paid',
    cod: 'COD',
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=1100');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Invoice - ${orderNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; }
        .invoice { max-width: 210mm; margin: 0 auto; padding: 20mm; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #10b981; }
        .logo { font-size: 24px; font-weight: 800; color: #1a1a1a; }
        .logo span { color: #10b981; }
        .logo-sub { font-size: 10px; color: #6b7280; margin-top: 4px; }
        .invoice-meta { text-align: right; }
        .invoice-meta h2 { font-size: 20px; color: #10b981; text-transform: uppercase; letter-spacing: 2px; }
        .invoice-meta div { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: 700; margin-bottom: 8px; }
        .info-box p { font-size: 13px; color: #374151; line-height: 1.5; }
        .info-box .bold { font-weight: 700; color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        thead tr { background: #f8fafc; }
        th { text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 700; border-bottom: 2px solid #e5e7eb; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals { margin-left: auto; width: 280px; }
        .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .totals .grand { font-size: 16px; font-weight: 800; border-top: 2px solid #1a1a1a; padding-top: 10px; margin-top: 6px; }
        .totals .grand .amount { color: #10b981; }
        .status-badges { display: flex; gap: 10px; margin-bottom: 24px; }
        .badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .badge-green { background: #d1fae5; color: #065f46; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .badge-slate { background: #f1f5f9; color: #334155; }
        .disclaimer { margin-top: 30px; padding: 16px; background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; font-size: 11px; color: #1e40af; line-height: 1.5; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        @media print { body { margin: 0; } .invoice { padding: 15mm; } }
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

  const whatsappNumber = '8801602444532';
  const whatsappText = encodeURIComponent(
    `Medicine Bazar Invoice\nOrder: ${orderNumber}\nTotal: ${formatPrice(total)}\nPayment: ${paymentLabel}\nDate: ${createdAt.toLocaleDateString()}`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={22} />
            <div>
              <h2 className="text-lg font-bold">Invoice</h2>
              <p className="text-emerald-100 text-xs">{orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Invoice Preview */}
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-slate-50">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm mx-auto max-w-[210mm]">
            <div ref={invoiceRef} className="invoice p-8 text-slate-900">
              {/* Header */}
              <div className="header flex justify-between items-start mb-8 pb-5 border-b-2 border-emerald-500">
                <div>
                  <div className="logo text-2xl font-extrabold text-slate-900">
                    Medicine<span className="text-emerald-500">Bazar</span>
                  </div>
                  <div className="logo-sub text-xs text-slate-400 mt-1">
                    <div>মেডিসিন বাজার — আপনার বিশ্বস্ত ফার্মেসি পার্টনার</div>
                    <div>Phone: 01602444532 | support@medicinebazar.com</div>
                  </div>
                </div>
                <div className="invoice-meta text-right">
                  <h2 className="text-xl font-bold text-emerald-600 uppercase tracking-wider">INVOICE</h2>
                  <div className="text-xs text-slate-400 mt-1">{orderNumber}</div>
                  <div className="text-xs text-slate-400">{createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="info-grid grid grid-cols-2 gap-6 mb-8">
                <div className="info-box">
                  <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Bill To</h4>
                  <p className="bold text-sm font-bold text-slate-900">{customerName}</p>
                  {customerEmail && <p className="text-xs text-slate-500">{customerEmail}</p>}
                  {shippingAddress && (
                    <>
                      <p className="text-xs text-slate-500 mt-1">{shippingAddress.address}</p>
                      <p className="text-xs text-slate-500">{shippingAddress.city}, {shippingAddress.postalCode || ''}</p>
                      <p className="text-xs text-slate-500">Phone: {shippingAddress.phone}</p>
                    </>
                  )}
                </div>
                <div className="info-box text-right">
                  <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Order Info</h4>
                  <p className="text-xs text-slate-600"><span className="font-semibold">Payment:</span> {paymentLabel}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-semibold">Payment Status:</span>{' '}
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      paymentStatus === 'paid' || paymentStatus === 'verified' || paymentStatus === 'cod'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {statusLabel[paymentStatus] || paymentStatus}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-semibold">Order Status:</span>{' '}
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800'
                        : orderStatus === 'cancelled' ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {statusLabel[orderStatus] || orderStatus}
                    </span>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b-2 border-slate-200">#</th>
                    <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b-2 border-slate-200">Item</th>
                    <th className="text-center py-2.5 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b-2 border-slate-200">Qty</th>
                    <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b-2 border-slate-200">Unit Price</th>
                    <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b-2 border-slate-200">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2.5 px-3 text-xs text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="text-sm font-bold text-slate-800">{item.name}</div>
                        {item.genericName && <div className="text-[10px] text-slate-400 mt-0.5">{item.genericName}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-center text-sm font-semibold text-slate-700">{item.quantity} {item.unit || ''}</td>
                      <td className="py-2.5 px-3 text-right text-sm text-slate-600">{formatPrice(item.price)}</td>
                      <td className="py-2.5 px-3 text-right text-sm font-bold text-slate-800">{formatPrice(item.total || (item.price * item.quantity))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="totals ml-auto" style={{ width: '280px' }}>
                <div className="flex justify-between py-1.5 text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-1.5 text-sm text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 text-sm text-slate-600">
                  <span>Delivery Charge</span>
                  <span>{deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}</span>
                </div>
                <div className="flex justify-between pt-3 mt-2 border-t-2 border-slate-900 text-lg font-extrabold">
                  <span>Grand Total</span>
                  <span className="text-emerald-600">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Note */}
              {note && (
                <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <span className="font-bold">Note:</span> {note}
                </div>
              )}

              {/* Disclaimer */}
              <div className="disclaimer mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 leading-relaxed">
                <strong>Medical Disclaimer:</strong> This is a computer-generated invoice. For prescription medicines, a valid prescription issued by a registered physician is mandatory. Medicine Bazar reserves the right to hold or modify orders lacking proper prescription documentation.
                <div className="mt-1 text-blue-600">
                  এটি একটি কম্পিউটার-জেনারেটেড ইনভয়েস। প্রেসক্রিপশন ওষুধের জন্য রেজিস্টার্ড চিকিৎসকের বৈধ প্রেসক্রিপশন বাধ্যতামূলক।
                </div>
              </div>

              {/* Footer */}
              <div className="footer mt-10 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-4">
                <div>Thank you for choosing Medicine Bazar — আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ</div>
                <div className="mt-1">medicinebazar.com | Phone: 01602444532 | facebook.com/medicinebazar24</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 pt-4 bg-white border-t border-slate-100 grid grid-cols-3 gap-3">
          <button
            onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Printer size={20} />
            <span className="text-xs">Print Invoice</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Download size={20} />
            <span className="text-xs">Save as PDF</span>
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

export default InvoiceTemplate;
