
'use client';

import React from 'react';
import type { Invoice } from '@/types/invoice';
// import { Logo } from '@/components/app/logo'; // Temporarily remove direct Logo component usage

interface ReceiptPreviewProps {
  invoice: Invoice | null;
}

const ReceiptPreview = React.forwardRef<HTMLDivElement, ReceiptPreviewProps>(({ invoice }, ref) => {
  if (!invoice) return null;

  return (
    <div ref={ref} className="p-4 bg-white text-black font-sans text-xs w-[288px] mx-auto my-2 shadow-md"> {/* Approx 3-inch receipt width */}
      <div className="text-center mb-3">
        {/* Placeholder for Logo to avoid potential issues with react-to-print and nested components/SVGs */}
        <div className="flex items-center justify-center gap-2 my-1" aria-label="SwiftStock Logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <span className="text-xl font-semibold text-primary">SwiftStock</span>
        </div>
        <h2 className="text-md font-bold">Sale Receipt</h2>
        <p>Date: {new Date(invoice.date).toLocaleDateString()} {new Date(invoice.date).toLocaleTimeString()}</p>
        <p>Invoice #: {invoice.invoiceNumber}</p>
      </div>
      
      <div className="mb-1">
        <h3 className="text-xs font-semibold border-b border-dashed border-gray-400 pb-0.5 mb-0.5">Customer: {invoice.customerName}</h3>
      </div>

      <table className="w-full mb-1 text-xs">
        <thead>
          <tr className="border-b border-dashed border-gray-400">
            <th className="text-left py-0.5 pr-0.5 font-semibold w-2/5">Item</th>
            <th className="text-center py-0.5 px-0.5 font-semibold">Qty</th>
            <th className="text-right py-0.5 px-0.5 font-semibold">Price</th>
            <th className="text-right py-0.5 pl-0.5 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map(item => (
            <tr key={item.productId} className="border-b border-dotted border-gray-300 last:border-b-0">
              <td className="py-0.5 pr-0.5 truncate max-w-[100px]">{item.name}</td>
              <td className="text-center py-0.5 px-0.5">{item.quantity}</td>
              <td className="text-right py-0.5 px-0.5">₦{item.price.toFixed(2)}</td>
              <td className="text-right py-0.5 pl-0.5">₦{item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 pt-1 border-t-2 border-dashed border-black text-right">
        <p className="text-sm font-bold">TOTAL: ₦{invoice.totalAmount.toFixed(2)}</p>
      </div>

      <div className="text-center mt-3 text-[10px]"> {/* Even smaller text for footer */}
        <p>Thank you for your purchase!</p>
        <p>SwiftStock POS</p>
      </div>
    </div>
  );
});

ReceiptPreview.displayName = 'ReceiptPreview';

export { ReceiptPreview };

