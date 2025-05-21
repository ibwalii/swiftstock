
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
  displayName?: string | null; // Added displayName
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string for date
  customerName: string; 
  items: InvoiceItem[];
  totalAmount: number;
  paymentMethod?: string;
  createdBy: CreatedByInfo;
}
