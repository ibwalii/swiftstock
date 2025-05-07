'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useInventory } from '@/hooks/use-inventory';
import type { InventoryItem } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit2, Trash2, PackageSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const initialFormState: Omit<InventoryItem, 'id'> = {
  name: '',
  sku: '',
  quantity: 0,
  price: 0,
  imageUrl: '',
};

export default function InventoryPage() {
  const { inventory, addItem, updateItem, deleteItem } = useInventory();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>(initialFormState);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      toast({ title: "Validation Error", description: "Name and SKU are required.", variant: "destructive"});
      return;
    }
    if (editingItem) {
      updateItem({ ...editingItem, ...formData });
      toast({ title: 'Item Updated', description: `${formData.name} has been updated successfully.` });
    } else {
      addItem(formData);
      toast({ title: 'Item Added', description: `${formData.name} has been added successfully.` });
    }
    setIsFormDialogOpen(false);
    setEditingItem(null);
    setFormData(initialFormState);
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData(initialFormState);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({ name: item.name, sku: item.sku, quantity: item.quantity, price: item.price, imageUrl: item.imageUrl || '' });
    setIsFormDialogOpen(true);
  };

  const handleDeleteConfirm = (itemId: string, itemName: string) => {
    deleteItem(itemId);
    toast({ title: 'Item Deleted', description: `${itemName} has been deleted.`, variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Inventory Management</CardTitle>
            <CardDescription>View, add, edit, or delete your inventory items.</CardDescription>
          </div>
          <Button onClick={openAddDialog} className="flex items-center gap-2">
            <PlusCircle size={18} /> Add New Item
          </Button>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-center">
                <PackageSearch size={64} className="mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-muted-foreground">No Inventory Items</h3>
                <p className="text-muted-foreground">Get started by adding your first inventory item.</p>
                <Button onClick={openAddDialog} className="mt-4">
                  <PlusCircle size={18} className="mr-2" /> Add Item
                </Button>
              </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center w-[130px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Image
                      src={item.imageUrl || `https://picsum.photos/seed/${item.sku || item.id}/60/60`}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover shadow-sm"
                      data-ai-hint="product image"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="mr-1 hover:text-primary">
                      <Edit2 size={16} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the item "{item.name}" from your inventory.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteConfirm(item.id, item.name)} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete item
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details of the item.' : 'Fill in the details for the new item.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">SKU</Label>
              <Input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} className="col-span-3" required min="0" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price</Label>
              <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} className="col-span-3" required min="0" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} className="col-span-3" placeholder="e.g., https://picsum.photos/seed/SKU/200" />
            </div>
            <DialogFooter>
                 <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingItem ? 'Save Changes' : 'Add Item'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
