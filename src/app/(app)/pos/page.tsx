'use client';

import React, { useState, useMemo, useRef } from 'react';
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
import { PlusCircle, Trash2, ShoppingCart, DollarSign, UserCircle, Search, MonitorPlay, Printer, MinusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Calculator } from '@/components/app/calculator';
import { CustomerDisplayModal } from '@/components/app/customer-display-modal';
import { useReactToPrint } from 'react-to-print';
import { Logo } from '@/components/app/logo';

interface CartItem extends InventoryItem {
  cartQuantity: number;
}

const ReceiptToPrint = React.forwardRef<HTMLDivElement, { invoice: Invoice | null }>(({ invoice }, ref) => {
  if (!invoice) return null;
  return (
    <div ref={ref} className="p-6 bg-white text-black font-sans text-xs w-[288px]"> {/* Standard 3-inch receipt width approx 72mm or 288px at 96dpi */}
      <div className="text-center mb-4">
        <div className="flex justify-center my-2"><Logo /></div>
        <h2 className="text-lg font-bold">Sale Receipt</h2>
        <p>Date: {new Date(invoice.date).toLocaleDateString()} {new Date(invoice.date).toLocaleTimeString()}</p>
        <p>Invoice #: {invoice.invoiceNumber}</p>
      </div>
      
      <div className="mb-2">
        <h3 className="text-sm font-semibold border-b border-dashed pb-0.5 mb-1">Customer: {invoice.customerName}</h3>
      </div>

      <table className="w-full mb-2 text-xs">
        <thead>
          <tr className="border-b border-dashed">
            <th className="text-left py-0.5 pr-0.5 font-semibold">Item</th>
            <th className="text-center py-0.5 px-0.5 font-semibold">Qty</th>
            <th className="text-right py-0.5 px-0.5 font-semibold">Price</th>
            <th className="text-right py-0.5 pl-0.5 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map(item => (
            <tr key={item.productId}>
              <td className="py-0.5 pr-0.5 ">{item.name}</td>
              <td className="text-center py-0.5 px-0.5">{item.quantity}</td>
              <td className="text-right py-0.5 px-0.5">${item.price.toFixed(2)}</td>
              <td className="text-right py-0.5 pl-0.5">${item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 pt-2 border-t border-dashed text-right">
        <p className="text-sm font-bold">TOTAL: ${invoice.totalAmount.toFixed(2)}</p>
      </div>

      <div className="text-center mt-4 text-xs">
        <p>Thank you for your purchase!</p>
        <p>SwiftStock POS</p>
      </div>
    </div>
  );
});
ReceiptToPrint.displayName = 'ReceiptToPrint';


export default function POSPage() {
  const { inventory, updateItemQuantity: updateInventoryQuantity, getItemById } = useInventory();
  const { addInvoice } = useInvoices();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isCustomerDisplayOpen, setIsCustomerDisplayOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${lastInvoice?.invoiceNumber || 'current-sale'}`,
    onAfterPrint: () => {
      toast({ title: 'Receipt Printed', description: 'The receipt has been sent to the printer.'});
      setIsReceiptDialogOpen(false); // Close dialog after printing
    },
    pageStyle: "@page { size: auto;  margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; } }",
  });

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

  const handleProcessSale = () => {
    if (cart.length === 0) {
      toast({ title: 'Empty Cart', description: 'Please add items to the cart to process a sale.', variant: 'destructive' });
      return;
    }
    if (!customerName.trim()) {
       toast({ title: 'Customer Name Required', description: 'Please enter a customer name.', variant: 'destructive' });
       return;
    }

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
      });
      
      setLastInvoice(newInvoice);
      setIsReceiptDialogOpen(true);
      setIsCustomerDisplayOpen(false);

      toast({ title: 'Sale Processed!', description: `Invoice ${newInvoice.invoiceNumber} created for ${customerName}.` });
      setCart([]);
      // setCustomerName('Walk-in Customer'); // Optionally reset customer name
      setSearchTerm('');
    } catch (error: any) {
       toast({ title: 'Error Processing Sale', description: error.message || "Could not update inventory.", variant: 'destructive' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-theme(spacing.32))] max-h-[calc(100vh-theme(spacing.32))] overflow-hidden">
      {/* Cart & Actions Panel (Left) - occupies 4 out of 12 columns on lg screens */}
      <div className="lg:col-span-4 flex flex-col space-y-3 max-h-full">
        <Card className="flex-grow flex flex-col overflow-hidden"> {/* Added overflow-hidden */}
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
          <CardContent className="flex-grow overflow-hidden p-0"> {/* Changed overflow-y-auto to overflow-hidden */}
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <ShoppingCart size={36} className="mb-2" />
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs">Add products from the right.</p>
              </div>
            ) : (
              <ScrollArea className="h-full"> {/* Wrap Table in ScrollArea if needed, or ensure CardContent handles scroll */}
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
                              max={item.quantity} // Inventory quantity
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
            <Button size="default" className="w-full font-semibold h-9 text-sm" onClick={handleProcessSale} disabled={cart.length === 0 || !customerName.trim()}>
              <DollarSign size={16} className="mr-1.5" /> Process Sale
            </Button>
            <Button size="default" variant="outline" className="w-full h-9 text-sm" onClick={() => setIsCustomerDisplayOpen(true)} disabled={cart.length === 0}>
              <MonitorPlay size={16} className="mr-1.5" /> Customer Display
            </Button>
          </div>
        </Card>
        <Calculator />
      </div>

      {/* Product Selection Panel (Right) - occupies 8 out of 12 columns */}
      <div className="lg:col-span-8 flex flex-col max-h-full">
        <Card className="flex-grow flex flex-col overflow-hidden"> {/* Added overflow-hidden */}
          <CardHeader className="p-3 border-b">
            <CardTitle className="text-lg">Available Products</CardTitle>
            <div className="relative mt-1.5">
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
          <CardContent className="flex-grow overflow-hidden p-2"> {/* Changed overflow-y-auto to overflow-hidden */}
            {filteredInventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <ShoppingCart size={40} className="mb-3" />
                <p className="text-md font-medium">No products found.</p>
                <p className="text-xs">Adjust search or check inventory.</p>
              </div>
            ) : (
              <ScrollArea className="h-full"> {/* Ensure ScrollArea is used if content might exceed CardContent height */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {filteredInventory.map((item) => (
                    <Card key={item.id} className="flex flex-col overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-150 cursor-pointer group" onClick={() => addToCart(item)}>
                      <div className="relative w-full aspect-[4/3]"> {/* Adjusted aspect ratio */}
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

      {/* Receipt Dialog */}
      {lastInvoice && (
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="sm:max-w-xs"> {/* Smaller dialog for receipt */}
          <DialogHeader className="p-4">
            <DialogTitle className="text-center text-lg">Sale Completed</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Invoice: {lastInvoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="hidden"> {/* This div is hidden but necessary for react-to-print to capture the content */}
            <ReceiptToPrint invoice={lastInvoice} ref={receiptRef} />
          </div>

          <div className="p-4 border-y max-h-[50vh] overflow-y-auto text-xs">
            {/* Simplified preview for dialog */}
            <p><strong>Customer:</strong> {lastInvoice.customerName}</p>
            <p><strong>Date:</strong> {new Date(lastInvoice.date).toLocaleDateString()}</p>
            <h4 className="font-semibold mt-1.5 border-t pt-1.5">Items:</h4>
            <ul className="space-y-0.5 my-1">
                {lastInvoice.items.map(item => (
                <li key={item.productId} className="flex justify-between">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>${item.subtotal.toFixed(2)}</span>
                </li>
                ))}
            </ul>
            <div className="border-t pt-1.5 mt-1.5 flex justify-between font-bold">
              <span>Total:</span>
              <span>${lastInvoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <DialogFooter className="p-4 flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button onClick={handlePrint} className="w-full">
                <Printer size={14} className="mr-2" /> Print Receipt
            </Button>
            <Button variant="outline" onClick={() => { setIsReceiptDialogOpen(false); }}  className="w-full">
                Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Customer Display Modal */}
      <CustomerDisplayModal 
        isOpen={isCustomerDisplayOpen}
        onClose={() => setIsCustomerDisplayOpen(false)}
        cartItems={cart}
        totalAmount={cartTotal}
      />
    </div>
  );
}

