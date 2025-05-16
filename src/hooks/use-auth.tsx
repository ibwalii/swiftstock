
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
  // Use stable initialDemoUsers as the initialValue for allUsers
  const [allUsers, setAllUsersInternal] = useLocalStorage<UserWithPassword[]>(ALL_USERS_KEY, initialDemoUsers);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This effect now primarily focuses on setting isLoadingAuth
    // and validating a potentially existing logged-in user against the (now stable) allUsers list.
    const storedLoggedInUserJson = typeof window !== 'undefined' ? window.localStorage.getItem(LOGGED_IN_USER_KEY) : null;
    if (storedLoggedInUserJson) {
        try {
            const storedLoggedInUser = JSON.parse(storedLoggedInUserJson) as User;
            // Check if this user exists in the current allUsers list (which might have been initialized from localStorage or initialDemoUsers)
            const userStillExistsAndValid = allUsers.some(
              u => u.id === storedLoggedInUser.id && 
                   u.email === storedLoggedInUser.email && 
                   (u.role === 'admin' || u.role === 'cashier')
            );

            if (!userStillExistsAndValid) {
                // If the stored user is no longer valid (e.g., deleted or role changed in a way that's inconsistent),
                // clear the logged-in user state.
                setUserInternal(null); // This will also clear it from localStorage via useLocalStorage's setValue
            } else if (!user || user.id !== storedLoggedInUser.id) {
                // If the current 'user' state is not set or doesn't match the valid stored user, update it.
                // This ensures the AuthContext 'user' is correctly initialized from a valid persisted session.
                // Note: useLocalStorage's useState initializer should ideally handle this based on localStorage.
                // This explicit setUserInternal might be redundant if useLocalStorage is robust.
                // However, to be safe, if there's a mismatch, we align.
                 const liveUser = allUsers.find(u => u.id === storedLoggedInUser.id);
                 if (liveUser) {
                    const { password, ...userToStore } = liveUser;
                    setUserInternal(userToStore);
                 } else {
                    setUserInternal(null);
                 }
            }
        } catch (e) {
            console.error("Error processing stored logged-in user:", e);
            setUserInternal(null);
        }
    }
    setIsLoadingAuth(false);
  // Run this effect once on mount.
  // allUsers is from useLocalStorage, it will be initialized from localStorage or initialDemoUsers.
  // setUserInternal is stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const setUser = (newUser: User | null) => {
    setUserInternal(newUser);
  }

  const setAllUsers = (users: UserWithPassword[] | ((prevUsers: UserWithPassword[]) => UserWithPassword[])) => {
    setAllUsersInternal(users);
  }

  const login = useCallback(async (credentials: { email: string; pass: string }, redirectTo: string = '/pos') => {
    const foundUser = allUsers.find(u => u.email === credentials.email && u.password === credentials.pass);

    if (foundUser) {
      const { password, ...userToStore } = foundUser;
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

