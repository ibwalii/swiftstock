
'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { User, UserWithPassword } from '@/types/user';
import { useLocalStorage } from './use-local-storage';

const LOGGED_IN_USER_KEY = 'swiftstock-logged-in-user';
const ALL_USERS_KEY = 'swiftstock-all-users';

const initialDemoUsers: UserWithPassword[] = [
  { id: uuidv4(), name: 'Admin User', email: 'admin@example.com', password: 'password', role: 'admin' },
  { id: uuidv4(), name: 'Cashier User', email: 'cashier@example.com', password: 'password', role: 'cashier' },
];

interface AuthContextType {
  user: User | null;
  allUsers: UserWithPassword[];
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  login: (credentials: { email: string; pass: string }, redirectTo?: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: Omit<UserWithPassword, 'id' | 'role'> & { role: 'admin' | 'cashier'}) => Promise<{ success: boolean; message?: string; user?: User }>;
  updateUserRole: (userId: string, newRole: 'admin' | 'cashier') => Promise<{ success: boolean; message?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserInternal] = useLocalStorage<User | null>(LOGGED_IN_USER_KEY, null);
  const [allUsers, setAllUsersInternal] = useLocalStorage<UserWithPassword[]>(ALL_USERS_KEY, initialDemoUsers);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedLoggedInUserJson = typeof window !== 'undefined' ? window.localStorage.getItem(LOGGED_IN_USER_KEY) : null;
    if (storedLoggedInUserJson) {
        try {
            const storedLoggedInUser = JSON.parse(storedLoggedInUserJson) as User;
            const userStillExistsAndValid = allUsers.some(
              u => u.id === storedLoggedInUser.id && 
                   u.email === storedLoggedInUser.email &&
                   u.name === storedLoggedInUser.name && // Check name as well
                   (u.role === 'admin' || u.role === 'cashier')
            );

            if (!userStillExistsAndValid) {
                setUserInternal(null);
            } else {
                 const liveUser = allUsers.find(u => u.id === storedLoggedInUser.id);
                 if (liveUser) {
                    const { password, ...userToStore } = liveUser;
                    // Ensure current user state is updated with latest from allUsers (e.g. if name/role changed by another admin)
                    if (!user || JSON.stringify(user) !== JSON.stringify(userToStore)) {
                        setUserInternal(userToStore);
                    }
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
  }, [allUsers, user, setUserInternal]);


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
    let message = 'User not found.';
    setAllUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return prevUsers;
      }
      const updatedUsers = [...prevUsers];
      const oldUser = updatedUsers[userIndex];
      updatedUsers[userIndex] = { ...oldUser, role: newRole };
      success = true;
      message = 'User role updated.';
      if (user && user.id === userId) {
        setUser({ ...user, role: newRole });
      }
      return updatedUsers;
    });
     return { success, message };
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
  }, [setAllUsers, user]);
  
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
