
'use client';

import React, { useState, useMemo } from 'react';
import { useInvoices } from '@/hooks/use-invoices';
import type { Invoice } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, FileText, Search, User as UserIcon } from 'lucide-react'; // Added UserIcon
import { Input } from '@/components/ui/input';

export default function InvoicingPage() {
  const { invoices } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    return invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.createdBy?.displayName && invoice.createdBy.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.createdBy?.email && invoice.createdBy.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        new Date(invoice.date).toLocaleDateString().includes(searchTerm)
    );
  }, [invoices, searchTerm]);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDialogOpen(true);
  };

  const totalRevenue = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  }, [invoices]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Invoices & Quotations</CardTitle>
          <CardDescription>View all generated invoices.</CardDescription>
           <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by invoice #, customer, salesperson, or date..."
              className="pl-8 w-full md:w-1/2 lg:w-2/3" // Increased width
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText size={64} className="mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-muted-foreground">No Invoices Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No invoices match your search criteria." : "No invoices have been generated yet. Sales from the POS will appear here."}
                </p>
              </div>
          ) : (
          <ScrollArea className="max-h-[calc(100vh-theme(spacing.64))]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Salesperson</TableHead> {/* Added Salesperson Column */}
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{invoice.createdBy?.displayName || invoice.createdBy?.email || 'N/A'}</TableCell> {/* Display Salesperson */}
                    <TableCell className="text-right">₦{invoice.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)}>
                        <Eye size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell colSpan={4} className="font-semibold text-lg">Total Revenue</TableCell> {/* Adjusted colSpan */}
                  <TableCell className="text-right font-semibold text-lg">₦{totalRevenue.toFixed(2)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedInvoice && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Invoice Details - {selectedInvoice.invoiceNumber}</DialogTitle>
              <DialogDescription>
                <strong>Customer:</strong> {selectedInvoice.customerName} <br />
                <strong>Date:</strong> {new Date(selectedInvoice.date).toLocaleDateString()} <br />
                <strong>Salesperson:</strong> {selectedInvoice.createdBy?.displayName || selectedInvoice.createdBy?.email || 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] my-4 pr-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">₦{item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₦{item.subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={4} className="font-semibold text-lg">Total Amount</TableCell>
                    <TableCell className="text-right font-semibold text-lg">₦{selectedInvoice.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </ScrollArea>
            <DialogFooter>
               <Button variant="outline" onClick={() => { alert('Printing invoice...'); setIsDialogOpen(false); }}>Print Invoice</Button>
              <DialogClose asChild>
                <Button type="button">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
