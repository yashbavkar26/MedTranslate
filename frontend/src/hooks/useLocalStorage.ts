import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark' | 'auto'>('theme', 'auto');

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto mode - follow system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  return { theme, setTheme };
}

export function useAccessibility() {
  const [dyslexicFont, setDyslexicFont] = useLocalStorage<boolean>('dyslexic-font', false);
  const [highContrast, setHighContrast] = useLocalStorage<boolean>('high-contrast', false);
  const [colorBlindMode, setColorBlindMode] = useLocalStorage<boolean>('color-blind', false);

  useEffect(() => {
    const root = document.documentElement;
    
    if (dyslexicFont) {
      root.classList.add('dyslexic-font');
    } else {
      root.classList.remove('dyslexic-font');
    }

    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (colorBlindMode) {
      root.classList.add('color-blind');
    } else {
      root.classList.remove('color-blind');
    }
  }, [dyslexicFont, highContrast, colorBlindMode]);

  return {
    dyslexicFont,
    setDyslexicFont,
    highContrast,
    setHighContrast,
    colorBlindMode,
    setColorBlindMode
  };
}
