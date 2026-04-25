"use client";

import React, { useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Camera, Moon, Sun, Type, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { isDark, toggleTheme, isAccessibleFont, toggleAccessibleFont, profileImage, setProfileImage, fontSizeMultiplier, setFontSizeMultiplier } = useTheme();
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors mb-8">
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </Link>

      <div className="glass rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold mb-8 text-center text-gradient">Your Profile</h1>

        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4 group">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-800" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 shadow-lg border-4 border-white dark:border-gray-800 flex items-center justify-center text-white text-3xl font-bold">
                U
              </div>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-3 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Camera size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Click the camera icon to change photo</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b border-gray-200 dark:border-gray-800 pb-2">Preferences</h2>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                {isDark ? <Moon size={24} /> : <Sun size={24} />}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">Dark Mode</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Switch to a darker theme</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isDark ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                <Type size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">Accessible Font</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Use a dyslexia-friendly font</p>
              </div>
            </div>
            <button 
              onClick={toggleAccessibleFont}
              className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${isAccessibleFont ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAccessibleFont ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl transition-colors gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <Type size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">Text Size</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Scale up the entire UI text</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-xl p-1">
              {[1, 1.25, 1.5, 2].map(size => (
                <button
                  key={size}
                  onClick={() => setFontSizeMultiplier(size)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${fontSizeMultiplier === size ? 'bg-white dark:bg-gray-600 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  {size}x
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
