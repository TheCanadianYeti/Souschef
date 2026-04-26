"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { profileImage } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-border-color shadow-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-color) 85%, transparent)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Removed the background box, padding, and rounded-xl */}
              <div className="group-hover:scale-105 transition-transform duration-300">
                <img src="/apple-touch-icon.png" alt="SousChef icon" className="h-9 w-9 object-contain" />
              </div>
              
              {/* Increased height slightly and removed width restriction to let the text expand */}
              {/* <img 
                src="/minimalist-logo.png" 
                alt="SousChef text logo" 
                className="h-5 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" 
              /> */}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/profile" className="focus:outline-none focus:ring-2 focus:ring-aged-gold rounded-full transition-transform hover:scale-105">
              {mounted && profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover shadow-sm border-2 border-border-color"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-accent-color to-aged-gold shadow-sm border-2 border-border-color" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}