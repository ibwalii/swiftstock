
'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AUTH_KEY = 'swiftstock-user'; // Changed key to store user object

export interface User {
  email: string;
  role: 'admin' | 'cashier';
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean; // Derived from user !== null
  isLoadingAuth: boolean;
  login: (credentials: { email: string; pass: string }, redirectTo?: string) => Promise<boolean>;
  logout: () => void;
  // setIsLoggedInOverride?: Dispatch<SetStateAction<boolean>>; // Might remove if not essential
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUserString = localStorage.getItem(AUTH_KEY);
    if (storedUserString) {
      try {
        const storedUser = JSON.parse(storedUserString) as User;
        // Basic validation for role
        if (storedUser && (storedUser.role === 'admin' || storedUser.role === 'cashier')) {
            setUser(storedUser);
        } else {
            localStorage.removeItem(AUTH_KEY); // Clear invalid data
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setIsLoadingAuth(false);
  }, []);

  const login = useCallback(async (credentials: { email: string; pass: string }, redirectTo: string = '/pos') => {
    let authenticatedUser: User | null = null;
    // Demo users
    if (credentials.email === 'admin@example.com' && credentials.pass === 'password') {
      authenticatedUser = { email: credentials.email, role: 'admin' };
    } else if (credentials.email === 'cashier@example.com' && credentials.pass === 'password') {
      authenticatedUser = { email: credentials.email, role: 'cashier' };
    } else if (credentials.email === 'user@example.com' && credentials.pass === 'password') { // Original demo user, make admin
      authenticatedUser = { email: credentials.email, role: 'admin' };
    }


    if (authenticatedUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      router.push(redirectTo);
      return true;
    }
    return false;
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);
  
  const isLoggedIn = user !== null;

  // Route protection logic
  useEffect(() => {
    if (!isLoadingAuth && typeof window !== 'undefined') {
      const isAppRoute = pathname.startsWith('/pos') || pathname.startsWith('/inventory') || pathname.startsWith('/invoicing');
      
      if (isAppRoute && !user) {
        router.replace('/login');
      } else if (pathname === '/login' && user) {
        router.replace('/pos');
      } else if (user?.role === 'cashier' && pathname.startsWith('/inventory')) {
        // Cashiers should not access inventory management
        router.replace('/pos'); 
      }
    }
  }, [user, isLoadingAuth, pathname, router]);


  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoadingAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

