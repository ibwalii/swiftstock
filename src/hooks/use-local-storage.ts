
'use client';

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void] {
  // The readValue function is memoized to prevent re-creation on every render
  // unless `initialValue` or `key` changes.
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

  // Initialize state with the value read from localStorage or the initialValue.
  // `readValue` is called directly here; `useState(readValue)` ensures it's called once.
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // This useEffect updates the component's state if `readValue` function reference changes.
  // This can happen if `key` or `initialValue` props to the hook change after initial mount,
  // or on initial client-side hydration if `readValue` was a placeholder on SSR.
  // If `initialValue` is stable (not a new ref like `[]` on each render), `readValue` will be stable too,
  // and this effect won't cause loops.
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);


  // The setValue function is memoized with useCallback.
  // It updates the component state and persists the value to localStorage.
  const setValue = useCallback((value: SetValue<T>) => {
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
      // Dispatch a storage event so other tabs/windows using the same key can sync.
      window.dispatchEvent(new StorageEvent('storage', { 
        key, 
        newValue: JSON.stringify(newValue), 
        storageArea: window.localStorage 
      }));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]); // `storedValue` is a dependency for when `value` is a function.

  // This useEffect listens for 'storage' events (e.g., from other tabs).
  // If the relevant localStorage key changes, it updates the component's state.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
         try {
            // Only update if the new value from storage is actually different from current state.
            // This helps prevent unnecessary re-renders or potential loops if events fire unexpectedly.
            const newValueFromStorage = event.newValue ? JSON.parse(event.newValue) : initialValue;
            if (JSON.stringify(storedValue) !== JSON.stringify(newValueFromStorage)) {
                 setStoredValue(newValueFromStorage);
            }
         } catch (error) {
            console.warn(`Error parsing stored value for key "${key}" on storage event:`, error);
            // Fallback to initialValue if parsing fails and it's different from current state
            if (JSON.stringify(storedValue) !== JSON.stringify(initialValue)) {
                setStoredValue(initialValue);
            }
         }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  // `initialValue` and `storedValue` are included to ensure the handler and its comparisons use fresh values.
  }, [key, initialValue, storedValue]); 

  return [storedValue, setValue];
}

