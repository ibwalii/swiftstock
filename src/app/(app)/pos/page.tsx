
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useInventory } from '@/hooks/use-inventory';
import { useInvoices } from '@/hooks/use-invoices';
import type { InventoryItem } from '@/types/inventory';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2, ShoppingCart, DollarSign, UserCircle, Search, MonitorPlay, Printer, MinusCircle, Barcode, AlertCircle, CheckCircle, CreditCard } from 'lucide-react'; // Added CreditCard for Checkout
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalculatorModal } from '@/components/app/calculator-modal';
import { CustomerDisplayModal } from '@/components/app/customer-display-modal';
import { CheckoutModal } from '@/components/app/checkout-modal'; // New Checkout Modal
import { ReceiptPreview } from '@/components/app/receipt-preview'; // New Receipt Preview Component
import { useReactToPrint } from 'react-to-print';


// Export CartItem to be used by CheckoutModal
export interface CartItem extends InventoryItem {
  cartQuantity: number;
}

export default function POSPage() {
  const { inventory, updateItemQuantity: updateInventoryQuantity, getItemById, getItemByBarcode } = useInventory();
  const { addInvoice } = useInvoices();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false); // State for new checkout modal

  const [isCustomerDisplayModalOpen, setIsCustomerDisplayModalOpen] = useState(false); // Renamed for clarity
  const [customerDisplayWindow, setCustomerDisplayWindow] = useState<Window | null>(null);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);

  const receiptPrintRef = useRef<HTMLDivElement>(null); // Ref for the actual printable receipt content
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);


  useEffect(() => {
    if (typeof window !== 'undefined') {
        successAudioRef.current = new Audio('/sounds/success.mp3');
        errorAudioRef.current = new Audio('/sounds/error.mp3');
    }
  }, []);

  const playSound = (type: 'success' | 'error') => {
    if (type === 'success' && successAudioRef.current) {
      successAudioRef.current.currentTime = 0;
      successAudioRef.current.play().catch(e => console.warn("Audio play failed:", e));
    } else if (type === 'error' && errorAudioRef.current) {
      errorAudioRef.current.currentTime = 0;
      errorAudioRef.current.play().catch(e => console.warn("Audio play failed:", e));
    }
  };


  const actualPrintHandler = useReactToPrint({
    content: () => {
      if (!receiptPrintRef.current) {
        toast({ title: "Print Error", description: "Receipt content not found.", variant: "destructive" });
        return null;
      }
      return receiptPrintRef.current;
    },
    documentTitle: `Receipt-${lastInvoice?.invoiceNumber || 'current-sale'}`,
    onAfterPrint: () => {
      toast({ title: 'Receipt Printed', description: 'The receipt has been sent to the printer.'});
      setIsReceiptDialogOpen(false); 
    },
    pageStyle: "@page { size: auto;  margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; } }",
  });

  const handlePrintReceipt = () => {
    actualPrintHandler?.();
  };

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory.filter(item => item.quantity > 0);
    return inventory.filter(
      (item) =>
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
        item.quantity > 0
    );
  }, [inventory, searchTerm]);

  const addToCart = (item: InventoryItem, quantity: number = 1) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      const newCartQuantity = existingItem.cartQuantity + quantity;
      if (newCartQuantity <= item.quantity) {
        setCart(
          cart.map((cartItem) =>
            cartItem.id === item.id ? { ...cartItem, cartQuantity: newCartQuantity } : cartItem
          )
        );
      } else {
        toast({ title: "Max Quantity Reached", description: `Cannot add more ${item.name} to cart. Available: ${item.quantity}`, variant: "destructive" });
      }
    } else {
      if (item.quantity >= quantity) {
        setCart([...cart, { ...item, cartQuantity: quantity }]);
      } else {
         toast({ title: "Out of Stock / Insufficient Stock", description: `${item.name} has only ${item.quantity} available.`, variant: "destructive" });
      }
    }
  };

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    const itemInInventory = getItemById(itemId);
    if (!itemInInventory) return;

    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else if (newQuantity > itemInInventory.quantity) {
        toast({ title: "Max Quantity Exceeded", description: `Only ${itemInInventory.quantity} ${itemInInventory.name} available.`, variant: "destructive" });
        setCart(cart.map((item) => (item.id === itemId ? { ...item, cartQuantity: itemInInventory.quantity } : item)));
    }
    else {
      setCart(cart.map((item) => (item.id === itemId ? { ...item, cartQuantity: newQuantity } : item)));
    }
  };
  
  const incrementCartItem = (itemId: string) => {
    const item = cart.find(ci => ci.id === itemId);
    if (item) updateCartQuantity(itemId, item.cartQuantity + 1);
  };

  const decrementCartItem = (itemId: string) => {
    const item = cart.find(ci => ci.id === itemId);
    if (item) updateCartQuantity(itemId, item.cartQuantity - 1);
  };


  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.cartQuantity, 0);
  }, [cart]);


  const handleBarcodeScan = () => {
    if (!barcodeInput.trim()) return;
    const item = getItemByBarcode(barcodeInput.trim());
    if (item) {
      addToCart(item, 1);
      toast({
        title: "Item Added",
        description: `${item.name} added to cart via barcode.`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" /> 
      });
      playSound('success');
      setBarcodeInput(''); 
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } else {
      toast({
        title: "Barcode Not Found",
        description: `No item found with barcode: ${barcodeInput}. Or item is out of stock.`,
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />
      });
      playSound('error');
      setBarcodeInput('');
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      toast({ title: 'Empty Cart', description: 'Please add items to the cart to process a sale.', variant: 'destructive' });
      return;
    }
    if (!customerName.trim()) {
       toast({ title: 'Customer Name Required', description: 'Please enter a customer name.', variant: 'destructive' });
       return;
    }
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmSale = (paymentMethod: string) => {
    const invoiceItems: InvoiceItem[] = cart.map((item) => ({
      productId: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.cartQuantity,
      price: item.price,
      subtotal: item.price * item.cartQuantity,
    }));

    try {
      cart.forEach(item => {
        updateInventoryQuantity(item.id, -item.cartQuantity);
      });

      const newInvoice = addInvoice({
        customerName,
        items: invoiceItems,
        totalAmount: cartTotal,
        paymentMethod: paymentMethod,
      });
      
      setLastInvoice(newInvoice);
      setIsCheckoutModalOpen(false); 
      setIsReceiptDialogOpen(true); 
      
      if (customerDisplayWindow && !customerDisplayWindow.closed) {
        customerDisplayWindow.postMessage({ type: 'SALE_COMPLETE', invoice: newInvoice }, '*');
      } else {
        setCustomerDisplayWindow(null); // Ensure reference is cleared if window was closed
      }

      toast({ title: 'Sale Processed!', description: `Invoice ${newInvoice.invoiceNumber} created for ${customerName} via ${paymentMethod}.` });
      setCart([]);
      setSearchTerm('');
      setBarcodeInput('');
    } catch (error: any) {
       toast({ title: 'Error Processing Sale', description: error.message || "Could not update inventory.", variant: 'destructive' });
    }
  };


  const openCustomerDisplayWindow = () => {
    const features = 'width=800,height=600,resizable,scrollbars=yes,status=yes';
    
    if (customerDisplayWindow && !customerDisplayWindow.closed) {
      customerDisplayWindow.focus();
      // Resend current cart state as it might have changed since window was opened
      customerDisplayWindow.postMessage({ type: 'UPDATE_CART', cartItems: cart, totalAmount: cartTotal }, '*');
      return;
    }

    const newWindow = window.open('/customer-display', '_blank', features);
    
    if (newWindow) {
      setCustomerDisplayWindow(newWindow);
      newWindow.onload = () => {
          newWindow.postMessage({ type: 'UPDATE_CART', cartItems: cart, totalAmount: cartTotal }, '*');
      };
      newWindow.onunload = () => {
          // Clear the reference when the user closes the window
          setCustomerDisplayWindow(null);
      };
    } else {
      // Handle popup blocker
      toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site to use the customer display window.",
          variant: "destructive"
      });
      setCustomerDisplayWindow(null); // Ensure it's null if window failed to open
    }
  };

  useEffect(() => {
    if (customerDisplayWindow && !customerDisplayWindow.closed) {
        customerDisplayWindow.postMessage({ type: 'UPDATE_CART', cartItems: cart, totalAmount: cartTotal }, '*');
    }
  }, [cart, cartTotal, customerDisplayWindow]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-4 flex flex-col space-y-3 max-h-full"> 
        <Card className="flex-grow flex flex-col overflow-hidden"> 
          <CardHeader className="p-3 border-b">
            <CardTitle className="text-lg">Current Sale</CardTitle>
            <div className="mt-1.5">
              <Label htmlFor="customerName" className="flex items-center mb-1 text-xs font-medium">
                <UserCircle size={14} className="mr-1.5 text-muted-foreground" /> Customer Name
              </Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-0"> 
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <ShoppingCart size={36} className="mb-2" />
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs">Scan a barcode or add products from the right.</p>
              </div>
            ) : (
              <ScrollArea className="h-full"> 
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="p-1.5 h-8">Item</TableHead>
                      <TableHead className="text-center w-20 p-1.5 h-8">Qty</TableHead>
                      <TableHead className="text-right p-1.5 h-8">Total</TableHead>
                      <TableHead className="text-right p-1 w-8 h-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium truncate max-w-[100px] p-1.5" title={item.name}>{item.name}</TableCell>
                        <TableCell className="text-center p-1">
                          <div className="flex items-center justify-center space-x-0.5">
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => decrementCartItem(item.id)}><MinusCircle size={12}/></Button>
                            <Input
                              type="number"
                              min="1"
                              max={item.quantity}
                              value={item.cartQuantity}
                              onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="h-6 w-8 text-center px-0.5 text-xs"
                            />
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => incrementCartItem(item.id)}><PlusCircle size={12}/></Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right p-1.5">${(item.price * item.cartQuantity).toFixed(2)}</TableCell>
                        <TableCell className="text-right p-1">
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive h-6 w-6">
                            <Trash2 size={12} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
           {cart.length > 0 && (
            <div className="p-3 border-t">
                <div className="flex justify-between items-center">
                    <span className="text-md font-semibold">Total:</span>
                    <span className="text-xl font-bold text-primary">${cartTotal.toFixed(2)}</span>
                </div>
            </div>
           )}
          <div className="p-3 border-t space-y-1.5">
            <Button size="default" className="w-full font-semibold h-9 text-sm" onClick={handleOpenCheckout} disabled={cart.length === 0 || !customerName.trim()}>
              <CreditCard size={16} className="mr-1.5" /> Checkout 
            </Button>
            <div className="grid grid-cols-2 gap-1.5">
                <Button size="default" variant="outline" className="w-full h-9 text-sm" onClick={() => setIsCustomerDisplayModalOpen(true)}>
                    <MonitorPlay size={16} className="mr-1.5" /> Modal Display
                </Button>
                 <Button size="default" variant="outline" className="w-full h-9 text-sm" onClick={openCustomerDisplayWindow}>
                    <MonitorPlay size={16} className="mr-1.5" /> Window Display
                </Button>
            </div>
            <CalculatorModal />
          </div>
        </Card>
      </div>

      <div className="lg:col-span-8 flex flex-col max-h-full"> 
        <Card className="flex-grow flex flex-col overflow-hidden"> 
          <CardHeader className="p-3 border-b space-y-2">
            <CardTitle className="text-lg">Available Products</CardTitle>
             <div className="flex gap-2">
                <div className="relative flex-grow">
                    <Barcode className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={barcodeInputRef}
                        type="text"
                        placeholder="Scan barcode..."
                        className="pl-8 w-full h-8 text-sm"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleBarcodeScan(); }}
                    />
                </div>
                <Button onClick={handleBarcodeScan} className="h-8 text-sm px-3">Scan</Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products by name or SKU..."
                className="pl-7 w-full h-8 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-2"> 
            {filteredInventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <ShoppingCart size={40} className="mb-3" />
                <p className="text-md font-medium">No products found.</p>
                <p className="text-xs">Adjust search or check inventory.</p>
              </div>
            ) : (
              <ScrollArea className="h-full"> 
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {filteredInventory.map((item) => (
                    <Card key={item.id} className="flex flex-col overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-150 cursor-pointer group" onClick={() => addToCart(item)}>
                      <div className="relative w-full aspect-[4/3]">
                        <Image
                          src={item.imageUrl || `https://picsum.photos/seed/${item.sku || item.id}/200/150`}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          data-ai-hint="product item"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
                      </div>
                      <div className="p-1.5 flex-grow flex flex-col justify-between text-xs">
                        <div>
                          <h3 className="font-semibold leading-tight truncate" title={item.name}>{item.name}</h3>
                          <p className="text-muted-foreground">SKU: {item.sku}</p>
                          {item.barcode && <p className="text-muted-foreground text-xs">BC: {item.barcode}</p>}
                        </div>
                        <div className="mt-0.5">
                          <p className="font-bold text-primary text-sm">${item.price.toFixed(2)}</p>
                          <p className="text-muted-foreground">Stock: {item.quantity}</p>
                        </div>
                      </div>
                      <Button
                          size="sm"
                          className="w-full rounded-t-none h-7 text-xs"
                          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                          disabled={item.quantity === 0 || (cart.find(ci => ci.id === item.id)?.cartQuantity ?? 0) >= item.quantity}
                        >
                          <PlusCircle size={12} className="mr-1" /> Add
                        </Button>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {lastInvoice && (
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader className="p-4">
            <DialogTitle className="text-center text-lg">Sale Completed</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Invoice: {lastInvoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="hidden"> 
            <ReceiptPreview ref={receiptPrintRef} invoice={lastInvoice} />
          </div>

          <div className="p-4 border-y max-h-[50vh] overflow-y-auto text-xs">
              <ReceiptPreview invoice={lastInvoice} />
          </div>
          
          <DialogFooter className="p-4 flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button onClick={handlePrintReceipt} className="w-full">
                <Printer size={14} className="mr-2" /> Print Receipt
            </Button>
            <Button variant="outline" onClick={() => setIsReceiptDialogOpen(false)}  className="w-full">
                Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      <CustomerDisplayModal 
        isOpen={isCustomerDisplayModalOpen}
        onClose={() => setIsCustomerDisplayModalOpen(false)}
        cartItems={cart}
        totalAmount={cartTotal}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cartItems={cart}
        totalAmount={cartTotal}
        customerName={customerName}
        onConfirmSale={handleConfirmSale}
      />
    </div>
  );
}

