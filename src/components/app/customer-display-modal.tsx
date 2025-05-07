'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { InventoryItem } from '@/types/inventory';
import { Logo } from './logo';

interface CartItem extends InventoryItem {
  cartQuantity: number;
}

interface CustomerDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
}

const CustomerDisplayModal: React.FC<CustomerDisplayModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalAmount,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl h-[85vh] flex flex-col p-0 shadow-2xl rounded-lg">
        <DialogHeader className="p-6 pb-4 border-b bg-card rounded-t-lg">
          <div className="flex flex-col items-center gap-2">
            <Logo />
            <DialogTitle className="text-4xl font-bold text-center text-primary">Your Order</DialogTitle>
          </div>
          <DialogDescription className="text-center text-lg text-muted-foreground mt-1">
            Please review your items below.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow px-6 py-4 bg-background">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-2xl">
              <ShoppingCart size={64} className="mb-4 text-primary/50" />
              <p>Your cart is currently empty.</p>
            </div>
          ) : (
            <Table className="text-lg">
              <TableHeader>
                <TableRow className="border-b-2 border-primary/20">
                  <TableHead className="w-2/5 text-xl font-semibold text-foreground">Item</TableHead>
                  <TableHead className="text-center text-xl font-semibold text-foreground">Quantity</TableHead>
                  <TableHead className="text-right text-xl font-semibold text-foreground">Unit Price</TableHead>
                  <TableHead className="text-right text-xl font-semibold text-foreground">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.id} className="border-b hover:bg-muted/50">
                    <TableCell className="font-medium py-4 text-foreground">{item.name}</TableCell>
                    <TableCell className="text-center py-4 text-foreground">{item.cartQuantity}</TableCell>
                    <TableCell className="text-right py-4 text-foreground">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right py-4 font-semibold text-foreground">${(item.price * item.cartQuantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
        
        <DialogFooter className="p-6 border-t bg-card rounded-b-lg">
            <div className="w-full flex justify-between items-center">
                <DialogClose asChild>
                    <Button type="button" variant="outline" size="lg" className="text-lg px-8 py-6" onClick={onClose}>
                        Close
                    </Button>
                </DialogClose>
                 <div className="text-right">
                    <p className="text-md text-muted-foreground">Total Amount Due</p>
                    <p className="text-5xl font-extrabold text-primary">${totalAmount.toFixed(2)}</p>
                </div>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { CustomerDisplayModal };

interface ShoppingCart extends React.SVGProps<SVGSVGElement> {}
