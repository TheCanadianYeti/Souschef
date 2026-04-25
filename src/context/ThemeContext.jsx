"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [profileImage, setProfileImage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('profileImage') || null;
    }
    return null;
  });

  const [isAccessibleFont, setIsAccessibleFont] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessibleFont') === 'true';
    }
    return false;
  });

  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fontSizeMultiplier');
      return saved ? parseFloat(saved) : 1;
    }
    return 1;
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    // Apply the 'dark' class to the HTML document root
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isAccessibleFont) {
      root.classList.add('font-accessible');
      localStorage.setItem('accessibleFont', 'true');
    } else {
      root.classList.remove('font-accessible');
      localStorage.setItem('accessibleFont', 'false');
    }
  }, [isAccessibleFont]);

  useEffect(() => {
    if (profileImage) {
      localStorage.setItem('profileImage', profileImage);
    } else {
      localStorage.removeItem('profileImage');
    }
  }, [profileImage]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--text-scale', fontSizeMultiplier.toString());
    localStorage.setItem('fontSizeMultiplier', fontSizeMultiplier.toString());
  }, [fontSizeMultiplier]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const toggleAccessibleFont = () => {
    setIsAccessibleFont((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ 
      isDark, toggleTheme, 
      isAccessibleFont, toggleAccessibleFont, 
      profileImage, setProfileImage,
      fontSizeMultiplier, setFontSizeMultiplier
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
