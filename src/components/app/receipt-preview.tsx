'use client';

import React from 'react';
import type { Invoice } from '@/types/invoice';
import { Logo } from '@/components/app/logo';

interface ReceiptPreviewProps {
  invoice: Invoice | null;
}

const ReceiptPreview = React.forwardRef<HTMLDivElement, ReceiptPreviewProps>(({ invoice }, ref) => {
  if (!invoice) return null;

  return (
    <div ref={ref} className="p-4 bg-white text-black font-sans text-xs w-[288px] mx-auto my-2 shadow-md"> {/* Approx 3-inch receipt width */}
      <div className="text-center mb-3">
        <div className="flex justify-center my-1"><Logo /></div>
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
              <td className="text-right py-0.5 px-0.5">${item.price.toFixed(2)}</td>
              <td className="text-right py-0.5 pl-0.5">${item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 pt-1 border-t-2 border-dashed border-black text-right">
        <p className="text-sm font-bold">TOTAL: ${invoice.totalAmount.toFixed(2)}</p>
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
