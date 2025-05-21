
export interface InvoiceItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CreatedByInfo {
  uid: string;
  email: string | null;
  // displayName?: string | null; // Add if you plan to store/use displayName
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string for date
  customerName: string; // Simplified for now, could be an object or ID
  items: InvoiceItem[];
  totalAmount: number;
  paymentMethod?: string;
  createdBy: CreatedByInfo;
  // notes?: string;
}
