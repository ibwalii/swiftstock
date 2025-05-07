'use client';

import type { Invoice } from '@/types/invoice';
import { useLocalStorage } from './use-local-storage';
import { v4 as uuidv4 } from 'uuid'; // Needs npm install uuid @types/uuid

const INVOICES_STORAGE_KEY = 'swiftstock-invoices';

export function useInvoices() {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>(
    INVOICES_STORAGE_KEY,
    []
  );

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'date'>): Invoice => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: uuidv4(),
      // Simple invoice number generation, could be more robust
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${String(invoices.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString(),
    };
    setInvoices([newInvoice, ...invoices]); // Add new invoices to the top
    return newInvoice;
  };

  const getInvoiceById = (invoiceId: string) => {
    return invoices.find((invoice) => invoice.id === invoiceId);
  };

  return {
    invoices,
    addInvoice,
    getInvoiceById,
  };
}
