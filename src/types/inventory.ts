export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  imageUrl?: string; // Optional: for product image
}
