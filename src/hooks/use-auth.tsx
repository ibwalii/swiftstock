
'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { User, UserWithPassword } from '@/types/user';
import { useLocalStorage } from './use-local-storage'; // Assuming useLocalStorage is in the same directory or correctly pathed

const LOGGED_IN_USER_KEY = 'swiftstock-logged-in-user';
const ALL_USERS_KEY = 'swiftstock-all-users';

const initialDemoUsers: UserWithPassword[] = [
  { id: uuidv4(), email: 'admin@example.com', password: 'password', role: 'admin' },
  { id: uuidv4(), email: 'cashier@example.com', password: 'password', role: 'cashier' },
];

interface AuthContextType {
  user: User | null;
  allUsers: UserWithPassword[];
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  login: (credentials: { email: string; pass: string }, redirectTo?: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: Omit<UserWithPassword, 'id'>) => Promise<{ success: boolean; message?: string; user?: User }>;
  updateUserRole: (userId: string, newRole: 'admin' | 'cashier') => Promise<{ success: boolean; message?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserInternal] = useLocalStorage<User | null>(LOGGED_IN_USER_KEY, null);
  const [allUsers, setAllUsersInternal] = useLocalStorage<UserWithPassword[]>(ALL_USERS_KEY, []);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Seed demo users if the list is empty
    if (allUsers.length === 0) {
      setAllUsersInternal(initialDemoUsers);
    }
    // Check if there's a logged-in user from a previous session
    const storedLoggedInUser = localStorage.getItem(LOGGED_IN_USER_KEY);
    if (storedLoggedInUser) {
        try {
            const parsedUser = JSON.parse(storedLoggedInUser) as User;
            // Ensure this user still exists in our main user list and roles are valid
            const userExists = allUsers.find(u => u.id === parsedUser.id && u.email === parsedUser.email);
            if (userExists && (parsedUser.role === 'admin' || parsedUser.role === 'cashier')) {
                 // setUserInternal(parsedUser); // useLocalStorage should handle this
            } else {
                localStorage.removeItem(LOGGED_IN_USER_KEY); // Clear invalid stored logged-in user
                // setUserInternal(null); // useLocalStorage handles this
            }
        } catch (e) {
            console.error("Error parsing stored logged-in user:", e);
            localStorage.removeItem(LOGGED_IN_USER_KEY);
            // setUserInternal(null);
        }
    }
    setIsLoadingAuth(false);
  }, [allUsers, setAllUsersInternal]);


  const setUser = (newUser: User | null) => {
    setUserInternal(newUser);
  }

  const setAllUsers = (users: UserWithPassword[] | ((prevUsers: UserWithPassword[]) => UserWithPassword[])) => {
    setAllUsersInternal(users);
  }

  const login = useCallback(async (credentials: { email: string; pass: string }, redirectTo: string = '/pos') => {
    const foundUser = allUsers.find(u => u.email === credentials.email && u.password === credentials.pass); // Plain text password check (DEMO ONLY)

    if (foundUser) {
      const { password, ...userToStore } = foundUser; // Don't store password in logged-in user state/storage
      setUser(userToStore);
      router.push(redirectTo);
      return true;
    }
    return false;
  }, [allUsers, router, setUser]);

  const logout = useCallback(() => {
    setUser(null);
    router.push('/login');
  }, [router, setUser]);

  const addUser = useCallback(async (userData: Omit<UserWithPassword, 'id'>) => {
    if (allUsers.some(u => u.email === userData.email)) {
      return { success: false, message: 'User with this email already exists.' };
    }
    const newUserWithId: UserWithPassword = { ...userData, id: uuidv4() };
    // In a real app, password would be hashed here before saving.
    // For demo, storing as is.
    setAllUsers(prevUsers => [...prevUsers, newUserWithId]);
    const { password, ...addedUser } = newUserWithId;
    return { success: true, user: addedUser };
  }, [allUsers, setAllUsers]);

  const updateUserRole = useCallback(async (userId: string, newRole: 'admin' | 'cashier') => {
    let success = false;
    setAllUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return prevUsers;
      }
      const updatedUsers = [...prevUsers];
      updatedUsers[userIndex] = { ...updatedUsers[userIndex], role: newRole };
      success = true;
      // If the updated user is the currently logged-in user, update their session too
      if (user && user.id === userId) {
        setUser({ ...user, role: newRole });
      }
      return updatedUsers;
    });
     return { success, message: success ? 'User role updated.' : 'User not found.' };
  }, [setAllUsers, user, setUser]);

  const deleteUser = useCallback(async (userId: string) => {
    if (user && user.id === userId) {
      return { success: false, message: "You cannot delete yourself." };
    }
    let success = false;
    setAllUsers(prevUsers => {
        const newUsers = prevUsers.filter(u => u.id !== userId);
        if (newUsers.length < prevUsers.length) {
            success = true;
        }
        return newUsers;
    });
    return { success, message: success ? 'User deleted.' : 'User not found or deletion failed.' };
  }, [allUsers, setAllUsers, user]);
  
  const isLoggedIn = user !== null;

  useEffect(() => {
    if (!isLoadingAuth && typeof window !== 'undefined') {
      const isAppRoute = pathname.startsWith('/pos') || pathname.startsWith('/inventory') || pathname.startsWith('/invoicing') || pathname.startsWith('/users');
      
      if (isAppRoute && !user) {
        router.replace('/login');
      } else if (pathname === '/login' && user) {
        router.replace('/pos');
      } else if (user?.role === 'cashier') {
        if (pathname.startsWith('/inventory') || pathname.startsWith('/users')) {
          router.replace('/pos'); 
        }
      }
    }
  }, [user, isLoadingAuth, pathname, router]);


  return (
    <AuthContext.Provider value={{ user, allUsers, isLoggedIn, isLoadingAuth, login, logout, addUser, updateUserRole, deleteUser }}>
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
