'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useInventory } from '@/hooks/use-inventory';
import { useInvoices } from '@/hooks/use-invoices';
import type { InventoryItem } from '@/types/inventory';
import type { InvoiceItem } from '@/types/invoice';
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
  TableFooter
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2, ShoppingCart, DollarSign, UserCircle, Search } from 'lucide-react';
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

interface CartItem extends InventoryItem {
  cartQuantity: number;
}

export default function POSPage() {
  const { inventory, updateItemQuantity: updateInventoryQuantity, getItemById } = useInventory();
  const { addInvoice } = useInvoices();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<ReturnType<typeof addInvoice> | null>(null);

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory.filter(item => item.quantity > 0);
    return inventory.filter(
      (item) =>
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
        item.quantity > 0
    );
  }, [inventory, searchTerm]);

  const addToCart = (item: InventoryItem) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      if (existingItem.cartQuantity < item.quantity) {
        setCart(
          cart.map((cartItem) =>
            cartItem.id === item.id ? { ...cartItem, cartQuantity: cartItem.cartQuantity + 1 } : cartItem
          )
        );
      } else {
        toast({ title: "Max Quantity Reached", description: `Cannot add more ${item.name} to cart.`, variant: "destructive" });
      }
    } else {
      if (item.quantity > 0) {
        setCart([...cart, { ...item, cartQuantity: 1 }]);
      } else {
         toast({ title: "Out of Stock", description: `${item.name} is out of stock.`, variant: "destructive" });
      }
    }
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    const itemInInventory = getItemById(itemId);
    if (!itemInInventory) return;

    if (quantity <= 0) {
      removeFromCart(itemId);
    } else if (quantity > itemInInventory.quantity) {
        toast({ title: "Max Quantity Exceeded", description: `Only ${itemInInventory.quantity} ${itemInInventory.name} available.`, variant: "destructive" });
        setCart(cart.map((item) => (item.id === itemId ? { ...item, cartQuantity: itemInInventory.quantity } : item)));
    }
    else {
      setCart(cart.map((item) => (item.id === itemId ? { ...item, cartQuantity: quantity } : item)));
    }
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
      // Update inventory quantities
      cart.forEach(item => {
        updateInventoryQuantity(item.id, -item.cartQuantity);
      });

      const newInvoice = addInvoice({
        customerName,
        items: invoiceItems,
        totalAmount: cartTotal,
      });
      
      setLastInvoice(newInvoice);
      setIsReceiptOpen(true);

      toast({ title: 'Sale Processed!', description: `Invoice ${newInvoice.invoiceNumber} created for ${customerName}.` });
      setCart([]);
      setCustomerName('');
      setSearchTerm('');
    } catch (error: any) {
       toast({ title: 'Error Processing Sale', description: error.message || "Could not update inventory.", variant: 'destructive' });
       // Potentially revert inventory changes if partial update occurred - complex logic not implemented here
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-theme(spacing.32))]">
      {/* Product Selection Panel */}
      <Card className="lg:col-span-2 flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl">Available Products</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products by name or SKU..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4">
            {filteredInventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <ShoppingCart size={48} className="mb-4" />
                <p className="text-lg font-medium">No products match your search or available.</p>
                <p>Try adjusting your search or adding items to inventory.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredInventory.map((item) => (
                <Card key={item.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
                  <Image
                    src={item.imageUrl || `https://picsum.photos/seed/${item.id}/200/150`}
                    alt={item.name}
                    width={200}
                    height={150}
                    className="w-full h-32 object-cover"
                    data-ai-hint="product item"
                  />
                  <CardHeader className="p-3 flex-grow">
                    <CardTitle className="text-base font-semibold leading-tight truncate" title={item.name}>{item.name}</CardTitle>
                    <CardDescription className="text-xs">SKU: {item.sku}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-bold text-primary">${item.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Stock: {item.quantity}</p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => addToCart(item)}
                      disabled={item.quantity === 0 || (cart.find(ci => ci.id === item.id)?.cartQuantity ?? 0) >= item.quantity}
                    >
                      <PlusCircle size={16} className="mr-2" /> Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Cart Panel */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl">Current Sale</CardTitle>
          <div className="mt-2">
            <Label htmlFor="customerName" className="flex items-center mb-1 text-sm font-medium">
              <UserCircle size={16} className="mr-2 text-muted-foreground" /> Customer Name
            </Label>
            <Input
              id="customerName"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-1">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <ShoppingCart size={48} className="mb-4" />
                <p className="text-lg font-medium">Your cart is empty</p>
                <p>Add products from the left panel.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center w-20">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium truncate max-w-[100px]" title={item.name}>{item.name}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="1"
                          max={item.quantity} // Max is inventory quantity
                          value={item.cartQuantity}
                          onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))}
                          className="h-8 w-16 text-center px-1"
                        />
                      </TableCell>
                      <TableCell className="text-right">${(item.price * item.cartQuantity).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive">
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                 <TableFooter>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="font-semibold text-lg">Total</TableCell>
                      <TableCell colSpan={2} className="text-right font-semibold text-lg">${cartTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableFooter>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
        <div className="p-4 border-t">
          <Button size="lg" className="w-full font-semibold text-base" onClick={handleProcessSale} disabled={cart.length === 0 || !customerName.trim()}>
            <DollarSign size={20} className="mr-2" /> Process Sale
          </Button>
        </div>
      </Card>

      {/* Receipt Dialog */}
      {lastInvoice && (
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sale Receipt - {lastInvoice.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Thank you, {lastInvoice.customerName}! Here is your receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p><strong>Date:</strong> {new Date(lastInvoice.date).toLocaleDateString()}</p>
            <h4 className="font-semibold mt-2">Items:</h4>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              <ul className="space-y-1 text-sm">
                {lastInvoice.items.map(item => (
                  <li key={item.productId} className="flex justify-between">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>${item.subtotal.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
             <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${lastInvoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { /* Logic for printing could go here */ alert('Printing receipt...'); setIsReceiptOpen(false); }}>Print Receipt</Button>
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
