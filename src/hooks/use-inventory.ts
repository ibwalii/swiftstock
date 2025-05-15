
'use client';

import type { InventoryItem } from '@/types/inventory';
import { useLocalStorage } from './use-local-storage';
import { v4 as uuidv4 } from 'uuid';

const INVENTORY_STORAGE_KEY = 'swiftstock-inventory';

const initialInventory: InventoryItem[] = [
  { id: uuidv4(), name: 'Wireless Mouse', sku: 'WM-001', quantity: 50, price: 25.99, imageUrl: 'https://placehold.co/200x150.png', barcode: '1234567890123' },
  { id: uuidv4(), name: 'Mechanical Keyboard', sku: 'MK-002', quantity: 30, price: 79.50, imageUrl: 'https://placehold.co/200x150.png', barcode: '2345678901234' },
  { id: uuidv4(), name: 'USB-C Hub', sku: 'UCH-003', quantity: 75, price: 32.00, imageUrl: 'https://placehold.co/200x150.png', barcode: '3456789012345' },
  { id: uuidv4(), name: '27-inch Monitor', sku: 'MON-004', quantity: 15, price: 299.99, imageUrl: 'https://placehold.co/200x150.png' },
  { id: uuidv4(), name: 'Laptop Stand', sku: 'LS-005', quantity: 40, price: 19.99, imageUrl: 'https://placehold.co/200x150.png', barcode: '4567890123456' },
  { id: uuidv4(), name: 'Webcam HD 1080p', sku: 'WC-006', quantity: 25, price: 45.00, imageUrl: 'https://placehold.co/200x150.png' },
  { id: uuidv4(), name: 'Bluetooth Speaker', sku: 'BTS-007', quantity: 60, price: 59.90, imageUrl: 'https://placehold.co/200x150.png' },
  { id: uuidv4(), name: 'Gaming Headset', sku: 'GH-008', quantity: 20, price: 89.75, imageUrl: 'https://placehold.co/200x150.png' },
  { id: uuidv4(), name: 'Ergonomic Chair', sku: 'EC-009', quantity: 10, price: 249.00, imageUrl: 'https://placehold.co/200x150.png' },
  { id: uuidv4(), name: 'Desk Lamp LED', sku: 'DL-010', quantity: 55, price: 22.50, imageUrl: 'https://placehold.co/200x150.png' },
  { id: uuidv4(), name: 'Portable SSD 1TB', sku: 'SSD-011', quantity: 33, price: 119.99, imageUrl: 'https://placehold.co/200x150.png' },
  { id: uuidv4(), name: 'Smartphone Gimbal', sku: 'SG-012', quantity: 18, price: 75.00, imageUrl: 'https://placehold.co/200x150.png' },
];


export function useInventory() {
  const [inventory, setInventory] = useLocalStorage<InventoryItem[]>(
    INVENTORY_STORAGE_KEY,
    initialInventory
  );

  const addItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem = { ...item, id: uuidv4() };
    setInventory((prevInventory) => [...prevInventory, newItem]);
    return newItem;
  };

  const updateItem = (updatedItem: InventoryItem) => {
    setInventory((prevInventory) =>
      prevInventory.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    return updatedItem;
  };
  
  const updateItemQuantity = (itemId: string, quantityChange: number) => {
    setInventory((prevInventory) => {
      const itemIndex = prevInventory.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        console.error("Item not found for quantity update.");
        throw new Error("Item not found in inventory for quantity update.");
      }
      
      const item = prevInventory[itemIndex];
      const newQuantity = item.quantity + quantityChange;

      if (newQuantity < 0) {
        console.warn(`Attempted to set quantity below zero for ${item.name}. Setting to 0.`);
        const updatedItem = { ...item, quantity: 0 };
         const newInventory = [...prevInventory];
        newInventory[itemIndex] = updatedItem;
        return newInventory;
      }
      
      const updatedItem = { ...item, quantity: newQuantity };
      const newInventory = [...prevInventory];
      newInventory[itemIndex] = updatedItem;
      return newInventory;
    });
  };

  const deleteItem = (itemId: string) => {
    setInventory((prevInventory) => prevInventory.filter((item) => item.id !== itemId));
  };

  const getItemById = (itemId: string): InventoryItem | undefined => {
    if (typeof window === 'undefined' && !inventory.length) return undefined; 
    return inventory.find((item) => item.id === itemId);
  };

  const getItemByBarcode = (barcode: string): InventoryItem | undefined => {
    if (typeof window === 'undefined' && !inventory.length) return undefined;
    return inventory.find((item) => item.barcode === barcode && item.quantity > 0);
  };

  return {
    inventory,
    addItem,
    updateItem,
    updateItemQuantity,
    deleteItem,
    getItemById,
    getItemByBarcode,
  };
}

