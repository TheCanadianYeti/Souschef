"use client";

import React, { useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Camera, Moon, Sun, Type, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { 
    isDark, toggleTheme, isAccessibleFont, toggleAccessibleFont, 
    profileImage, setProfileImage, fontSizeMultiplier, setFontSizeMultiplier 
  } = useTheme();
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setProfileImage(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation - Back to Dashboard */}
      <Link href="/" className="inline-flex items-center gap-2 text-warm-dark/60 hover:text-brick transition-colors mb-8 font-medium group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="glass rounded-3xl p-8 sm:p-12 shadow-xl border border-parchment-deep">
        <h1 className="text-4xl font-bold mb-10 text-center text-gradient tracking-tight">Your Profile</h1>

        {/* Profile Image Section */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative mb-4 group">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-32 h-32 rounded-full object-cover shadow-xl border-4 border-parchment shadow-brick/5" />
            ) : (
              /* Brand Gradient for empty state */
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-brick to-aged-gold shadow-xl border-4 border-parchment flex items-center justify-center text-page text-4xl font-bold">
                {/* Dynamically using 'A' for Alice/Anh if you like, or just 'U' */}
                A
              </div>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-3 bg-brick text-page rounded-full shadow-lg hover:bg-ink transition-all focus:outline-none focus:ring-2 focus:ring-brick active:scale-90"
            >
              <Camera size={20} />
            </button>
            <input 
              type="file" ref={fileInputRef} onChange={handleImageUpload} 
              accept="image/*" className="hidden" 
            />
          </div>
          <p className="text-sm text-warm-dark/50 font-medium">Click to update photo</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-ink border-b border-parchment-deep pb-2 tracking-tight">Preferences</h2>
          
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-5 bg-parchment/40 rounded-2xl border border-parchment-deep/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brick/10 text-brick rounded-xl">
                {isDark ? <Moon size={24} /> : <Sun size={24} />}
              </div>
              <div>
                <p className="font-bold text-ink">Dark Mode</p>
                <p className="text-sm text-warm-dark/60">Switch to a darker theme</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brick ${isDark ? 'bg-brick' : 'bg-parchment-deep'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-page shadow-sm transition-transform ${isDark ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Accessible Font Toggle */}
          <div className="flex items-center justify-between p-5 bg-parchment/40 rounded-2xl border border-parchment-deep/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-aged-gold/10 text-aged-gold rounded-xl">
                <Type size={24} />
              </div>
              <div>
                <p className="font-bold text-ink">Accessible Font</p>
                <p className="text-sm text-warm-dark/60">Dyslexia-friendly typography</p>
              </div>
            </div>
            <button 
              onClick={toggleAccessibleFont}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-aged-gold ${isAccessibleFont ? 'bg-aged-gold' : 'bg-parchment-deep'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-page shadow-sm transition-transform ${isAccessibleFont ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Text Size Multiplier */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-parchment/40 rounded-2xl border border-parchment-deep/50 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-ink/10 text-ink rounded-xl">
                <Type size={20} strokeWidth={3} />
              </div>
              <div>
                <p className="font-bold text-ink">UI Text Scale</p>
                <p className="text-sm text-warm-dark/60">Adjust reading comfort</p>
              </div>
            </div>
            <div className="flex items-center bg-parchment-deep/50 rounded-xl p-1.5 border border-parchment-deep">
              {[1, 1.25, 1.5, 2].map(size => (
                <button
                  key={size}
                  onClick={() => setFontSizeMultiplier(size)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${fontSizeMultiplier === size ? 'bg-ink text-page shadow-md' : 'text-warm-dark hover:bg-parchment/60'}`}
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