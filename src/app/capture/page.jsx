"use client";

import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, ArrowRight, Loader2, CheckCircle2, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import WebcamCapture from '../../components/WebcamCapture';
import { saveLocalRecipe } from '../../data/mockRecipes';

// API Base URL — set NEXT_PUBLIC_API_URL=/api on Vercel, or http://localhost:3001/api locally
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function CapturePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('url'); // 'url', 'upload'
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/recipes/from-url`, { url });

      const newRecipe = response.data.data;
      if (!newRecipe.id) newRecipe.id = Date.now().toString(); // Assign ID if missing


      setSuccess(true);

      setTimeout(() => {
        router.push(`/recipe/${newRecipe.id}`);
      }, 1500);
    } catch (err) {
      console.error('URL Extraction Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to extract recipe from URL');
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    await processFile(file);
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    setError('');

    const formData = new FormData();
    formData.append('photo', file);

    try {
      console.log(`[DEBUG] Calling API: ${API_BASE_URL}/recipes/capture`);
      const response = await axios.post(`${API_BASE_URL}/recipes/capture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newRecipe = response.data.data;
      if (!newRecipe.id) newRecipe.id = Date.now().toString(); // Assign ID if missing


      setSuccess(true);

      setTimeout(() => {
        router.push(`/recipe/${newRecipe.id}`);
      }, 1500);
    } catch (err) {
      console.error('File Upload Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to process image');
      setIsProcessing(false);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => setShowCamera(true);

  const handleCameraCapture = async (file) => {
    setShowCamera(false);
    await processFile(file);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4 text-text-primary">Capture a Recipe</h1>
        <p className="text-text-secondary">
          Paste a link or snap a photo of a cookbook, and our AI will extract everything for you.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="glass rounded-3xl p-2 mb-8 flex relative">
        <div
          className={`absolute inset-y-2 w-[calc(50%-0.5rem)] rounded-2xl shadow-sm transition-all duration-300 ${activeTab === 'upload' ? 'translate-x-full ml-2' : 'ml-0'}`}
          style={{ backgroundColor: 'var(--surface-color)' }}
        />
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-3 text-center rounded-2xl relative z-10 font-medium transition-colors ${activeTab === 'url' ? 'text-accent-color' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Paste Link
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 text-center rounded-2xl relative z-10 font-medium transition-colors ${activeTab === 'upload' ? 'text-accent-color' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Upload/Camera
        </button>
      </div>

      <div className="glass rounded-3xl p-8 border border-border-color shadow-xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {activeTab === 'url' ? (
          <form onSubmit={handleUrlSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-primary">
                Recipe URL
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://tiktok.com/... or https://blog.com/..."
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-input-border bg-input-bg text-text-primary focus:outline-none focus:border-accent-color transition-colors placeholder:text-text-muted"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isProcessing || success}
              className="w-full py-4 bg-accent-color hover:opacity-80 text-page rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
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
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Take Photo Button (Visible on Mobile) */}
              <button
                onClick={triggerCamera}
                disabled={isProcessing || success}
                className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-border-color rounded-3xl hover:bg-surface-color transition-colors disabled:opacity-50"
              >
                <div className="p-4 bg-accent-color/10 dark:bg-accent-color/20 rounded-full text-accent-color">
                  <Camera size={32} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg text-text-primary">Take Photo</p>
                  <p className="text-sm text-text-secondary">Use your camera</p>
                </div>
              </button>

              {/* Upload File Button */}
              <button
                onClick={triggerUpload}
                disabled={isProcessing || success}
                className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-border-color rounded-3xl hover:bg-surface-color transition-colors disabled:opacity-50"
              >
                <div className="p-4 bg-accent-color/10 dark:bg-accent-color/20 rounded-full text-accent-color">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg text-text-primary">Upload File</p>
                  <p className="text-sm text-text-secondary">JPG, PNG or WEBP</p>
                </div>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {showCamera && (
              <WebcamCapture
                onCapture={handleCameraCapture}
                onCancel={() => setShowCamera(false)}
              />
            )}

            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="animate-spin text-accent-color" size={48} />
                <div className="text-center">
                  <p className="font-bold text-xl text-text-primary">Processing your image...</p>
                  <p className="text-text-secondary">Extracting text and formatting recipe</p>
                </div>
              </div>
            )}

            {success && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <CheckCircle2 className="text-green-500" size={48} />
                <div className="text-center">
                  <p className="font-bold text-xl text-text-primary">Recipe Captured!</p>
                  <p className="text-text-secondary">Redirecting to your new recipe...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}