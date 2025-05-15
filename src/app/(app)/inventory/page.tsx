
'use client';

import React, { useState, useRef } from 'react';
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
import { PlusCircle, Edit2, Trash2, PackageSearch, UploadCloud, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const initialFormState: Omit<InventoryItem, 'id'> = {
  name: '',
  sku: '',
  quantity: 0,
  price: 0,
  imageUrl: '', // This will store the data URI
  barcode: '',
};

export default function InventoryPage() {
  const { inventory, addItem, updateItem, deleteItem } = useInventory();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>(initialFormState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: 'Image Too Large',
          description: 'Please select an image smaller than 2MB.',
          variant: 'destructive',
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setFormData((prev) => ({ ...prev, imageUrl: dataUri }));
        setImagePreview(dataUri);
      };
      reader.readAsDataURL(file);
    } else {
      // If no file is selected (e.g., user clears selection), clear the preview and data URI
      // For edit mode, if user clears, we might want to revert to original image or allow clearing
      if (!editingItem?.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: '' }));
        setImagePreview(null);
      }
    }
  };
  
  const removeImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: ''}));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      toast({ title: "Validation Error", description: "Name and SKU are required.", variant: "destructive"});
      return;
    }
    
    const itemDataToSave: Omit<InventoryItem, 'id'> = {
      ...formData,
      imageUrl: imagePreview || formData.imageUrl || '', // Prioritize new preview, then existing form data
    };


    if (editingItem) {
      updateItem({ ...editingItem, ...itemDataToSave });
      toast({ title: 'Item Updated', description: `${formData.name} has been updated successfully.` });
    } else {
      addItem(itemDataToSave);
      toast({ title: 'Item Added', description: `${formData.name} has been added successfully.` });
    }
    closeFormDialog();
  };

  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setEditingItem(null);
    setFormData(initialFormState);
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData(initialFormState);
    setImagePreview(null);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({ 
        name: item.name, 
        sku: item.sku, 
        quantity: item.quantity, 
        price: item.price, 
        imageUrl: item.imageUrl || '', 
        barcode: item.barcode || '' 
    });
    setImagePreview(item.imageUrl || null);
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
                <TableHead>Barcode</TableHead>
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
                      src={item.imageUrl || `https://placehold.co/60x60.png`}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover shadow-sm"
                      data-ai-hint="product image"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.barcode || '-'}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">₦{item.price.toFixed(2)}</TableCell>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details of the item.' : 'Fill in the details for the new item.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" name="barcode" value={formData.barcode || ''} onChange={handleInputChange} placeholder="e.g. 1234567890123"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} required min="0" />
                </div>
                <div className="space-y-1">
                <Label htmlFor="price">Price (₦)</Label>
                <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required min="0" />
                </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUpload">Product Image</Label>
              {imagePreview && (
                <div className="relative group w-32 h-32">
                  <Image src={imagePreview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md border" data-ai-hint="image preview" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={removeImage}
                  >
                    <XCircle size={14} />
                  </Button>
                </div>
              )}
              <Input 
                id="imageUpload" 
                name="imageUpload" 
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={handleImageChange} 
                ref={fileInputRef}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              <p className="text-xs text-muted-foreground">Max file size: 2MB. PNG, JPG, WEBP accepted.</p>
            </div>

            <DialogFooter className="mt-4">
                 <Button type="button" variant="outline" onClick={closeFormDialog}>Cancel</Button>
              <Button type="submit">{editingItem ? 'Save Changes' : 'Add Item'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

