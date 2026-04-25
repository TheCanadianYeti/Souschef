"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  /* ─── State Initialization ─────────────────────────────────────────────── */

  const [mounted, setMounted] = useState(false);
  
  const [profileImage, setProfileImage] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('profileImage') || null;
    return null;
  });

  const [isAccessibleFont, setIsAccessibleFont] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('accessibleFont') === 'true';
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
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // New Accessibility States
  const [isHighContrast, setIsHighContrast] = useState(() => 
    typeof window !== 'undefined' ? localStorage.getItem('highContrast') === 'true' : false
  );
  const [isLowStimulation, setIsLowStimulation] = useState(() => 
    typeof window !== 'undefined' ? localStorage.getItem('lowStimulation') === 'true' : false
  );
  const [colorblindMode, setColorblindMode] = useState(() => 
    typeof window !== 'undefined' ? localStorage.getItem('colorblindMode') || 'none' : 'none'
  );

  /* ─── Effects (Syncing to DOM/Storage) ─────────────────────────────────── */

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Theme (Dark/Light)
    isDark ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Font scaling
    root.style.setProperty('--text-scale', fontSizeMultiplier.toString());
    localStorage.setItem('fontSizeMultiplier', fontSizeMultiplier.toString());

    // Accessible Font
    isAccessibleFont ? root.classList.add('font-accessible') : root.classList.remove('font-accessible');
    localStorage.setItem('accessibleFont', isAccessibleFont);

    // High Contrast
    isHighContrast ? root.classList.add('high-contrast') : root.classList.remove('high-contrast');
    localStorage.setItem('highContrast', isHighContrast);

    // Low Stimulation
    isLowStimulation ? root.classList.add('low-stimulation') : root.classList.remove('low-stimulation');
    localStorage.setItem('lowStimulation', isLowStimulation);

    // Colorblindness
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (colorblindMode !== 'none') root.classList.add(colorblindMode);
    localStorage.setItem('colorblindMode', colorblindMode);
  }, [isDark, fontSizeMultiplier, isAccessibleFont, isHighContrast, isLowStimulation, colorblindMode]);

  useEffect(() => {
    if (profileImage) localStorage.setItem('profileImage', profileImage);
    else localStorage.removeItem('profileImage');
  }, [profileImage]);

  /* ─── Handlers ────────────────────────────────────────────────────────── */

  const toggleTheme = () => setIsDark((prev) => !prev);
  const toggleAccessibleFont = () => setIsAccessibleFont((prev) => !prev);
  const contextValue = {
    mounted,
    isDark,
    setIsDark,
    toggleTheme,
    isAccessibleFont,
    setIsAccessibleFont,
    toggleAccessibleFont,
    fontSizeMultiplier,
    setFontSizeMultiplier,
    profileImage,
    setProfileImage,
    isHighContrast,
    setIsHighContrast,
    isLowStimulation,
    setIsLowStimulation,
    colorblindMode,
    setColorblindMode,
  };

  /* ─── Render ───────────────────────────────────────────────────────────── */

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    
    {/* Only render the SVG on the client to avoid mismatch */}
    {mounted && (
      <svg style={{ display: 'none' }} aria-hidden="true">
        <filter id="protanopia-filter">
          <feColorMatrix values="0.567, 0.433, 0, 0, 0 0.558, 0.442, 0, 0, 0 0, 0.242, 0.758, 0, 0 0, 0, 0, 1, 0" />
        </filter>
        <filter id="deuteranopia-filter">
          <feColorMatrix values="0.625, 0.375, 0, 0, 0 0.7, 0.3, 0, 0, 0 0, 0.3, 0.7, 0, 0 0, 0, 0, 1, 0" />
        </filter>
        <filter id="tritanopia-filter">
          <feColorMatrix values="0.95, 0.05, 0, 0, 0 0, 0.433, 0.567, 0, 0 0, 0.475, 0.525, 0, 0 0, 0, 0, 1, 0" />
        </filter>
      </svg>
    )}
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