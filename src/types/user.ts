
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'cashier';
}

export interface UserWithPassword extends User {
  password?: string; // Optional: only present when creating/updating password
}
