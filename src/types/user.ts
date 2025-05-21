
export interface User {
  id: string;
  name: string; // Added name field
  email: string;
  role: 'admin' | 'cashier';
}

export interface UserWithPassword extends User {
  password?: string; // Optional: only present when creating/updating password
}

