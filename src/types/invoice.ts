
export interface InvoiceItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string for date
  customerName: string; // Simplified for now, could be an object or ID
  items: InvoiceItem[];
  totalAmount: number;
  paymentMethod?: string; 
  // notes?: string;
}

