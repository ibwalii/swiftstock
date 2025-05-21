
'use client';

import type { Invoice, CreatedByInfo } from '@/types/invoice';
import { useLocalStorage } from './use-local-storage';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './use-auth'; // Import useAuth

const INVOICES_STORAGE_KEY = 'swiftstock-invoices';
const initialInvoices: Invoice[] = [];

export function useInvoices() {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>(
    INVOICES_STORAGE_KEY,
    initialInvoices
  );
  const { user } = useAuth(); // Get the current user

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'date' | 'createdBy'>): Invoice => {
    if (!user) {
      // This should ideally not happen if UI prevents invoice creation when not logged in
      // Or, handle this more gracefully, perhaps by disallowing invoice creation
      throw new Error("User must be logged in to create an invoice.");
    }

    const createdByInfo: CreatedByInfo = {
      uid: user.id, // Assuming user.id from useAuth is the UID
      email: user.email,
      // displayName: user.displayName || null, // Add if displayName is available and needed
    };

    const newInvoice: Invoice = {
      ...invoiceData,
      id: uuidv4(),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${String(invoices.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString(),
      createdBy: createdByInfo,
    };
    setInvoices((prevInvoices) => [newInvoice, ...prevInvoices]); // Add new invoices to the top
    return newInvoice;
  };

  const getInvoiceById = (invoiceId: string) => {
    if (typeof window === 'undefined' && !invoices.length) return undefined;
    return invoices.find((invoice) => invoice.id === invoiceId);
  };

  return {
    invoices,
    addInvoice,
    getInvoiceById,
  };
}
