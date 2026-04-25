"use client";

import React, { useState } from 'react';
import { Upload, Link as LinkIcon, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CapturePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('url'); // 'url', 'upload'
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // TODO: BACKEND INTEGRATION
    // Replace with actual API call to Claude/backend for extraction:
    // axios.post('/api/recipes/from-url', { url })
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        // Redirect to the newly created mock recipe (ID 1 for now)
        router.push('/recipe/1');
      }, 1500);
    }, 2500);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4 text-gradient">Capture a Recipe</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Paste a link or upload a video/photo, and our AI will extract the ingredients and steps for you.
        </p>
      </div>

      <div className="glass rounded-3xl p-2 mb-8 flex relative">
        <div 
          className={`absolute inset-y-2 w-[calc(50%-0.5rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-sm transition-all duration-300 ${activeTab === 'upload' ? 'translate-x-full ml-2' : 'ml-0'}`}
        />
        <button 
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-3 text-center rounded-2xl relative z-10 font-medium transition-colors ${activeTab === 'url' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Paste Link
        </button>
        <button 
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 text-center rounded-2xl relative z-10 font-medium transition-colors ${activeTab === 'upload' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Upload File
        </button>
      </div>

      <div className="glass rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl">
        {activeTab === 'url' ? (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Recipe URL
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="url" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://tiktok.com/... or https://blog.com/..." 
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isProcessing || success}
              className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Extracting Recipe...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={24} />
                  Success!
                </>
              ) : (
                <>
                  Extract Recipe
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-500">
                <Upload size={32} />
              </div>
              <div>
                <p className="font-medium text-lg mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">Video (MP4, MOV) or Image (JPG, PNG)</p>
              </div>
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={isProcessing || success}
              className="w-full mt-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {isProcessing ? (
                <><Loader2 className="animate-spin" size={24} /> Processing File...</>
              ) : success ? (
                <><CheckCircle2 size={24} /> Success!</>
              ) : (
                <><ArrowRight size={20} /> Simulate Upload & Extract</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
