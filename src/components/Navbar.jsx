"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, ChefHat } from 'lucide-react';

export default function Navbar() {
  const { isDark, toggleTheme, profileImage } = useTheme();

  return (
    <nav className="fixed w-full z-50 glass border-b transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-accent-color rounded-xl text-white group-hover:scale-105 transition-transform duration-300">
                <ChefHat size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-gradient">Souschef</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/profile" className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full transition-transform hover:scale-105">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="h-8 w-8 rounded-full object-cover shadow-sm border-2 border-white dark:border-gray-800" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 shadow-sm border-2 border-white dark:border-gray-800" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
