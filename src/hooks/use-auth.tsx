'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AUTH_KEY = 'swiftstock-isLoggedIn';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  login: (redirectTo?: string) => Promise<boolean>;
  logout: () => void;
  setIsLoggedInOverride?: Dispatch<SetStateAction<boolean>>; // For mock purposes if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This effect runs only on the client after hydration
    const storedAuth = localStorage.getItem(AUTH_KEY);
    setIsLoggedIn(storedAuth === 'true');
    setIsLoadingAuth(false);
  }, []);

  const login = useCallback(async (redirectTo: string = '/pos') => {
    // In a real app, this would involve API calls
    localStorage.setItem(AUTH_KEY, 'true');
    setIsLoggedIn(true);
    router.push(redirectTo); // Use push for navigation after login
    return true;
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsLoggedIn(false);
    router.push('/login'); // Use push for navigation after logout
  }, [router]);
  
  // Route protection logic
  useEffect(() => {
    if (!isLoadingAuth && typeof window !== 'undefined') { // Ensure runs on client
      const isAppRoute = pathname.startsWith('/pos') || pathname.startsWith('/inventory') || pathname.startsWith('/invoicing');
      if (isAppRoute && !isLoggedIn) {
        router.replace('/login');
      } else if (pathname === '/login' && isLoggedIn) {
        router.replace('/pos');
      }
    }
  }, [isLoggedIn, isLoadingAuth, pathname, router]);


  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoadingAuth, login, logout }}>
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
