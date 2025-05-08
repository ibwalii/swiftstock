
'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/app/logo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart } from 'lucide-react';
import type { InventoryItem } from '@/types/inventory';
import type { Invoice } from '@/types/invoice'; // Import Invoice type

interface CartItem extends InventoryItem {
  cartQuantity: number;
}

interface CustomerDisplayState {
  cartItems: CartItem[];
  totalAmount: number;
  invoice?: Invoice | null; // Add invoice to state
}

export default function CustomerDisplayPage() {
  const [displayState, setDisplayState] = useState<CustomerDisplayState>({
    cartItems: [],
    totalAmount: 0,
    invoice: null,
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Basic security check for origin if needed in production
      // if (event.origin !== window.location.origin) return; 
      
      const { type, cartItems, totalAmount, invoice } = event.data;
      if (type === 'UPDATE_CART') {
        setDisplayState({ cartItems, totalAmount, invoice: null }); // Clear invoice on cart update
      } else if (type === 'SALE_COMPLETE') {
        setDisplayState(prevState => ({ ...prevState, invoice: invoice, cartItems: [], totalAmount: 0 })); // Show invoice and clear cart
      }
    };

    window.addEventListener('message', handleMessage);
    // Notify opener that the window is ready
    if (window.opener && typeof window.opener.postMessage === 'function') {
      window.opener.postMessage({ type: 'CUSTOMER_DISPLAY_READY' }, window.location.origin); // Specify targetOrigin
    }


    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const { cartItems, totalAmount, invoice } = displayState;

  if (invoice) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center">
            <Logo />
            <h1 className="text-5xl font-bold text-primary mt-8 mb-4">Thank You!</h1>
            <p className="text-2xl text-muted-foreground mb-2">Your order is complete.</p>
            <p className="text-xl text-muted-foreground mb-6">Invoice Number: {invoice.invoiceNumber}</p>
            <div className="text-3xl font-bold text-foreground">
                Total: ₦{invoice.totalAmount.toFixed(2)}
            </div>
            <p className="mt-12 text-sm text-muted-foreground">Please wait for your receipt.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground p-0 overflow-hidden">
      <header className="p-6 pb-4 border-b bg-card sticky top-0 z-10">
        <div className="flex flex-col items-center gap-2">
          <Logo />
          <h1 className="text-4xl font-bold text-center text-primary">Your Order</h1>
        </div>
        <p className="text-center text-lg text-muted-foreground mt-1">
          Items will appear here as they are added.
        </p>
      </header>
      
      <ScrollArea className="flex-grow px-6 py-4">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-2xl pt-10">
            <ShoppingCart size={80} className="mb-6 text-primary/30" />
            <p className="text-3xl">Waiting for items...</p>
          </div>
        ) : (
          <Table className="text-xl"> {/* Increased base text size */}
            <TableHeader>
              <TableRow className="border-b-2 border-primary/20">
                <TableHead className="w-2/5 text-2xl font-semibold">Item</TableHead> {/* Increased header size */}
                <TableHead className="text-center text-2xl font-semibold">Quantity</TableHead>
                <TableHead className="text-right text-2xl font-semibold">Unit Price</TableHead>
                <TableHead className="text-right text-2xl font-semibold">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartItems.map((item) => (
                <TableRow key={item.id} className="border-b hover:bg-muted/50">
                  <TableCell className="font-medium py-5">{item.name}</TableCell> {/* Increased padding */}
                  <TableCell className="text-center py-5">{item.cartQuantity}</TableCell>
                  <TableCell className="text-right py-5">₦{item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right py-5 font-semibold">₦{(item.price * item.cartQuantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
      
      <footer className="p-8 border-t bg-card sticky bottom-0 z-10">
        <div className="w-full flex justify-end items-center">
           <div className="text-right">
              <p className="text-xl text-muted-foreground">Total Amount Due</p> {/* Increased text size */}
              <p className="text-6xl font-extrabold text-primary">₦{totalAmount.toFixed(2)}</p> {/* Increased total size */}
          </div>
        </div>
      </footer>
    </div>
  );
}

