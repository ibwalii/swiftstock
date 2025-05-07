'use client';

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void] {
  // Memoize the read function to avoid re-running on every render unless key changes
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // This effect ensures that the state is updated if the localStorage value changes externally
  // or on initial mount if the value was not immediately available (e.g. SSR placeholder)
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);


  const setValue = (value: SetValue<T>) => {
    if (typeof window === 'undefined') {
      console.warn(
        `Tried to set localStorage key "${key}" even though no window was found`
      );
      return;
    }
    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      setStoredValue(newValue);
      // Optionally dispatch a storage event so other tabs can sync
      window.dispatchEvent(new StorageEvent('storage', { key }));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  // Listen to storage events to sync state across tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
         try {
            setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
         } catch (error) {
            console.warn(`Error parsing stored value for key "${key}" on storage event:`, error);
            setStoredValue(initialValue);
         }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);


  return [storedValue, setValue];
}
