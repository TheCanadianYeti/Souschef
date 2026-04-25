"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { ChefHat } from 'lucide-react';

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
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              {/* Icon container uses Brick */}
              <div className="p-2 bg-accent-color rounded-xl text-page group-hover:scale-105 transition-transform duration-300">
                <ChefHat size={24} />
              </div>
              {/* Brand text uses your custom text-gradient (Brick to Gold) */}
              <span className="font-bold text-xl tracking-tight text-gradient">Souschef</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Focus ring updated to Gold */}
            <Link href="/profile" className="focus:outline-none focus:ring-2 focus:ring-aged-gold rounded-full transition-transform hover:scale-105">
              {mounted && profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
<<<<<<< HEAD
                  className="h-8 w-8 rounded-full object-cover shadow-sm border-2 border-border-color"
=======
                  className="h-8 w-8 rounded-full object-cover shadow-sm border-2 border-parchment-deep"
>>>>>>> cb811277b0ceab74e11f137c7bb6cdfa5b72a5a0
                />
              ) : (
                /* Swapped Purple Gradient for Brick/Gold Gradient */
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-accent-color to-aged-gold shadow-sm border-2 border-border-color" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}