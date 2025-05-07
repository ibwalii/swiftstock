'use client';

import type { InventoryItem } from '@/types/inventory';
import { useLocalStorage } from './use-local-storage';
import { v4 as uuidv4 } from 'uuid'; // Needs npm install uuid @types/uuid

const INVENTORY_STORAGE_KEY = 'swiftstock-inventory';

const initialInventory: InventoryItem[] = [
  { id: uuidv4(), name: 'Wireless Mouse', sku: 'WM-001', quantity: 50, price: 25.99, imageUrl: 'https://picsum.photos/seed/mouse/200/200' },
  { id: uuidv4(), name: 'Mechanical Keyboard', sku: 'MK-002', quantity: 30, price: 79.50, imageUrl: 'https://picsum.photos/seed/keyboard/200/200' },
  { id: uuidv4(), name: 'USB-C Hub', sku: 'UCH-003', quantity: 75, price: 32.00, imageUrl: 'https://picsum.photos/seed/hub/200/200' },
  { id: uuidv4(), name: '27-inch Monitor', sku: 'MON-004', quantity: 15, price: 299.99, imageUrl: 'https://picsum.photos/seed/monitor/200/200' },
];


export function useInventory() {
  const [inventory, setInventory] = useLocalStorage<InventoryItem[]>(
    INVENTORY_STORAGE_KEY,
    initialInventory
  );

  const addItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem = { ...item, id: uuidv4() };
    setInventory([...inventory, newItem]);
    return newItem;
  };

  const updateItem = (updatedItem: InventoryItem) => {
    setInventory(
      inventory.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    return updatedItem;
  };
  
  const updateItemQuantity = (itemId: string, quantityChange: number) => {
    const item = inventory.find(i => i.id === itemId);
    if (item) {
      const newQuantity = item.quantity + quantityChange;
      if (newQuantity < 0) {
        throw new Error("Quantity cannot be negative.");
      }
      const updatedItem = { ...item, quantity: newQuantity };
      updateItem(updatedItem);
      return updatedItem;
    }
    throw new Error("Item not found.");
  };

  const deleteItem = (itemId: string) => {
    setInventory(inventory.filter((item) => item.id !== itemId));
  };

  const getItemById = (itemId: string) => {
    return inventory.find((item) => item.id === itemId);
  };

  return {
    inventory,
    addItem,
    updateItem,
    updateItemQuantity,
    deleteItem,
    getItemById,
  };
}
