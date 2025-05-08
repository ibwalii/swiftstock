
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { CartItem } from '@/app/(app)/pos/page'; // Import CartItem from POS page
import { ReceiptPreview } from './receipt-preview'; // Import ReceiptPreview
import { CreditCard, Smartphone, Send } from 'lucide-react';

// Using inline SVG for Naira sign as lucide-react might not have it directly
const NairaSign = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5L17.25 7.5M6.75 16.5L17.25 16.5M12 3.75L12 20.25M8.25 12L15.75 12M6 7.5L6 5.25C6 4.42157 6.67157 3.75 7.5 3.75H16.5C17.3284 3.75 18 4.42157 18 5.25V7.5M6 16.5V18.75C6 19.5784 6.67157 20.25 7.5 20.25H16.5C17.3284 20.25 18 19.5784 18 18.75V16.5" />
  </svg>
);


interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
  customerName: string;
  onConfirmSale: (paymentMethod: string) => void;
}

type PaymentMethod = 'Cash' | 'Card' | 'Mobile Pay';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalAmount,
  customerName,
  onConfirmSale,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');

  const handlePaymentConfirm = () => {
    onConfirmSale(paymentMethod);
  };

  const dummyInvoiceForPreview = {
    id: 'preview-id',
    invoiceNumber: 'PREVIEW-001',
    date: new Date().toISOString(),
    customerName: customerName,
    items: cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.cartQuantity,
        price: item.price,
        subtotal: item.price * item.cartQuantity,
    })),
    totalAmount: totalAmount,
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Checkout</DialogTitle>
          <DialogDescription>
            Review your order and select a payment method for {customerName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-grow overflow-hidden">
          {/* Left Side: Payment Options & Summary */}
          <div className="p-6 flex flex-col space-y-6 border-r overflow-y-auto">
            <div>
              <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
              <RadioGroup value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)} className="space-y-3">
                <Label htmlFor="cash" className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                  <RadioGroupItem value="Cash" id="cash" />
                  <NairaSign className="h-5 w-5 text-green-600" />
                  <span>Cash</span>
                </Label>
                <Label htmlFor="card" className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                  <RadioGroupItem value="Card" id="card" />
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Card</span>
                </Label>
                <Label htmlFor="mobile" className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                  <RadioGroupItem value="Mobile Pay" id="mobile" />
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  <span>Mobile Pay</span>
                </Label>
              </RadioGroup>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₦{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (0%):</span> 
                  <span>₦0.00</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Due:</span>
                  <span className="text-primary">₦{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side: Receipt Preview */}
          <div className="p-6 bg-muted/30 flex flex-col overflow-hidden">
             <h3 className="text-lg font-semibold mb-3 text-center">Receipt Preview</h3>
            <ScrollArea className="flex-grow border rounded-md bg-white p-1 shadow-inner">
                 <div className="transform scale-[0.95] origin-top"> {/* Slightly scale down for better fit */}
                    <ReceiptPreview invoice={dummyInvoiceForPreview} />
                 </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-6 border-t flex-col sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" onClick={() => alert('Send receipt feature not implemented.')} className="w-full sm:w-auto" disabled>
            <Send size={16} className="mr-2" /> Send Receipt (N/A)
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <DialogClose asChild>
                <Button type="button" variant="ghost" className="w-full sm:w-auto">Cancel</Button>
            </DialogClose>
            <Button onClick={handlePaymentConfirm} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle size={16} className="mr-2" /> Confirm Payment
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper Icon for Checkout Modal (not used directly, but could be)
const CheckCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

