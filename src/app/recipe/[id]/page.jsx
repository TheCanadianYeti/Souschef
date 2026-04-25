"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchRecipeById } from '../../../data/mockRecipes';
import { Clock, Users, Play, ShoppingCart, ArrowLeft, Mic, ChevronRight, ChevronLeft, Check, ChefHat, Minimize2 } from 'lucide-react';
import Link from 'next/link';

const playChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function RecipePage() {
  const { id } = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCooking, setIsCooking] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState('');
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [customMultiplierInput, setCustomMultiplierInput] = useState('');
  const [isCustomMultiplier, setIsCustomMultiplier] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerMinimized, setIsTimerMinimized] = useState(false);

  useEffect(() => {
    // TODO: BACKEND INTEGRATION
    // Replace with: axios.get(`/api/recipes/${id}`).then(res => setRecipe(res.data));
    const load = async () => {
      const data = await fetchRecipeById(id);
      setRecipe(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleStartCooking = () => {
    setIsCooking(true);
    setCurrentStepIndex(0);
    // TODO: BACKEND INTEGRATION
    // axios.post(`/api/cook/${id}/start`)
  };

  const handleAskQuestion = () => {
    setIsListening(true);
    setVoiceResponse('');
    
    // Simulate Voice Q&A flow
    setTimeout(() => {
      setIsListening(false);
      setVoiceResponse("For this step, you want the garlic to be fragrant but not browned, so about 30 seconds on medium heat.");
      // TODO: BACKEND INTEGRATION
      // const response = await axios.post(`/api/cook/${id}/ask`, { audioData })
      // playAudio(response.data.audioUrl)
    }, 2000);
  };

  useEffect(() => {
    if (isCooking && recipe && recipe.steps[currentStepIndex]) {
      const stepDuration = recipe.steps[currentStepIndex].duration_seconds || 0;
      setTimerLeft(stepDuration);
      setIsTimerRunning(stepDuration > 0);
      setIsTimerMinimized(false);
    }
  }, [currentStepIndex, isCooking, recipe]);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timerLeft > 0) {
      interval = setInterval(() => {
        setTimerLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playChime();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerLeft]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  if (!recipe) {
    return <div className="container mx-auto px-4 py-8 text-center text-xl">Recipe not found.</div>;
  }

  if (isCooking) {
    const currentStep = recipe.steps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / recipe.steps.length) * 100;

    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
        {/* Cooking Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between glass">
          <button onClick={() => setIsCooking(false)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>Exit</span>
          </button>
          <div className="font-bold text-lg truncate max-w-[200px] sm:max-w-md">{recipe.title}</div>
          <div className="text-sm font-medium text-primary-500">
            Step {currentStepIndex + 1} of {recipe.steps.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-200 dark:bg-gray-800 w-full">
          <div className="h-full bg-primary-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Main Cooking View */}
        <div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 max-w-4xl mx-auto w-full relative">
          <div className="absolute top-8 right-8 animate-pulse text-primary-500 hidden sm:flex items-center gap-2">
            <ChefHat size={20} />
            <span className="text-sm font-medium">Hands-free active</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold leading-tight text-center mb-12 animate-in fade-in slide-in-from-bottom-4">
            {currentStep.instruction}
          </h2>

          {currentStep.duration_seconds > 0 && (
            isTimerMinimized ? (
              <button 
                onClick={() => setIsTimerMinimized(false)}
                className={`fixed bottom-28 right-6 sm:bottom-32 sm:right-12 z-50 px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-mono font-bold text-3xl transition-all hover:scale-105 ${timerLeft === 0 ? 'bg-green-500 text-white shadow-green-500/40 animate-pulse' : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-black/20'}`}
              >
                <Clock size={28} className={isTimerRunning && timerLeft > 0 ? "animate-pulse" : ""} />
                {Math.floor(timerLeft / 60)}:{(timerLeft % 60).toString().padStart(2, '0')}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-6 mb-12 relative w-full max-w-lg">
                <button 
                  onClick={() => setIsTimerMinimized(true)}
                  className="absolute -top-6 right-4 sm:-right-4 p-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full shadow-sm"
                  title="Minimize Timer"
                >
                  <Minimize2 size={20} />
                </button>
                <div className={`px-12 py-6 bg-gray-100 dark:bg-gray-800 rounded-full font-mono text-5xl sm:text-6xl text-gray-800 dark:text-gray-200 shadow-inner transition-colors ${timerLeft === 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : ''}`}>
                  {Math.floor(timerLeft / 60)}:{(timerLeft % 60).toString().padStart(2, '0')}
                </div>
              
              <div className="flex flex-wrap justify-center gap-3">
                {timerLeft > 0 ? (
                  <>
                    <button 
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`px-8 py-3 rounded-full font-bold text-white transition-all text-lg shadow-md hover:-translate-y-0.5 ${isTimerRunning ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-green-500 hover:bg-green-600 shadow-green-500/30'}`}
                    >
                      {isTimerRunning ? 'Pause Timer' : 'Start Timer'}
                    </button>
                    <button 
                      onClick={() => {
                        setTimerLeft(currentStep.duration_seconds);
                        setIsTimerRunning(false);
                      }}
                      className="px-6 py-3 rounded-full font-bold bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all text-lg"
                    >
                      Reset
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setTimerLeft(currentStep.duration_seconds);
                      setIsTimerRunning(false);
                    }}
                    className="px-8 py-3 rounded-full font-bold bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all text-lg"
                  >
                    Timer Done! (Restart)
                  </button>
                )}
                
                {timerLeft > 0 && (
                  <button 
                    onClick={() => {
                      setTimerLeft(0);
                      setIsTimerRunning(false);
                      if (currentStepIndex === recipe.steps.length - 1) setIsCooking(false);
                      else setCurrentStepIndex(p => p + 1);
                    }}
                    className="px-6 py-3 rounded-full font-bold bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-all text-lg border border-red-200 dark:border-red-800/50"
                  >
                    Skip Step
                  </button>
                )}
              </div>
            </div>
            )
          )}

          {/* Voice Q&A Simulation */}
          <div className="w-full max-w-md">
            <button 
              onClick={handleAskQuestion}
              disabled={isListening}
              className={`w-full py-4 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all duration-300 ${isListening ? 'bg-red-500/10 text-red-500 border-2 border-red-500' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border-2 border-transparent text-gray-600 dark:text-gray-300'}`}
            >
              <div className={`p-4 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-gray-900 shadow-sm'}`}>
                <Mic size={24} />
              </div>
              <span className="font-medium">{isListening ? 'Listening...' : 'Ask a question ("How crispy?")'}</span>
            </button>

            {voiceResponse && (
              <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-2xl text-primary-800 dark:text-primary-200 animate-in fade-in slide-in-from-top-2 flex gap-3">
                <ChefHat className="shrink-0 mt-1" />
                <p>{voiceResponse}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-between max-w-4xl mx-auto w-full">
          <button 
            onClick={() => setCurrentStepIndex(p => Math.max(0, p - 1))}
            disabled={currentStepIndex === 0}
            className="p-4 rounded-full border border-gray-300 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            onClick={() => {
              if (currentStepIndex === recipe.steps.length - 1) setIsCooking(false);
              else setCurrentStepIndex(p => p + 1);
            }}
            className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-primary-500/40"
          >
            {currentStepIndex === recipe.steps.length - 1 ? (
              <><Check size={24} /> Finish Cooking</>
            ) : (
              <>Next Step <ChevronRight size={24} /></>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors mb-6">
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-3xl overflow-hidden shadow-xl aspect-[4/5] relative">
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex gap-2 flex-wrap mb-2">
                {recipe.tags.map(tag => (
                  <span key={tag} className="text-xs font-medium px-2 py-1 bg-white/20 backdrop-blur-md rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleStartCooking}
            className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/30 hover:-translate-y-1"
          >
            <Play size={24} fill="currentColor" />
            Start Cooking
          </button>
        </div>

        <div className="md:col-span-2">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{recipe.title}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">{recipe.description}</p>
          
          <div className="flex flex-wrap gap-6 p-6 glass rounded-2xl mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full"><Clock size={20} className="text-primary-500" /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Time</p>
                <p className="font-bold">{recipe.prep_time + recipe.cook_time} mins</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full"><Users size={20} className="text-primary-500" /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Servings</p>
                <p className="font-bold">{recipe.servings * servingsMultiplier}</p>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 border-b border-gray-200 dark:border-gray-800 pb-4 gap-4 sm:gap-0">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold">Ingredients</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-500 font-medium">Scale:</span>
                  {[1, 1.5, 2, 3].map(m => (
                    <button 
                      key={m}
                      onClick={() => {
                        setServingsMultiplier(m);
                        setIsCustomMultiplier(false);
                      }}
                      className={`px-3 py-1 rounded-full border transition-colors ${servingsMultiplier === m && !isCustomMultiplier ? 'bg-primary-500 border-primary-500 text-white font-medium shadow-sm' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      {m}x
                    </button>
                  ))}
                  <div className="relative flex items-center ml-1">
                    <input 
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="Custom"
                      value={isCustomMultiplier ? customMultiplierInput : ''}
                      onChange={(e) => {
                        setCustomMultiplierInput(e.target.value);
                        setIsCustomMultiplier(true);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          setServingsMultiplier(val);
                        }
                      }}
                      onFocus={() => setIsCustomMultiplier(true)}
                      className={`w-28 px-3 py-1 rounded-full border bg-transparent text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${isCustomMultiplier ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                    />
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 text-sm font-bold text-primary-500 hover:text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-xl transition-colors">
                <ShoppingCart size={18} />
                Order via Instacart
              </button>
            </div>
            <ul className="space-y-3">
              {recipe.ingredients.map(ing => {
                let displayQuantity = ing.quantity;
                if (servingsMultiplier !== 1) {
                  const parsed = parseFloat(ing.quantity);
                  if (!isNaN(parsed)) {
                    displayQuantity = (parsed * servingsMultiplier).toLocaleString(undefined, { maximumFractionDigits: 2 });
                  }
                }
                return (
                  <li key={ing.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-gray-800 dark:text-gray-200">{ing.name}</span>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      {displayQuantity} {ing.unit}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4 border-b border-gray-200 dark:border-gray-800 pb-4">Steps</h2>
            <div className="space-y-6">
              {recipe.steps.map((step, idx) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-bold text-sm shrink-0">
                      {idx + 1}
                    </div>
                    {idx < recipe.steps.length - 1 && <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-800 my-2" />}
                  </div>
                  <div className="pb-6 pt-1">
                    <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">{step.instruction}</p>
                    {step.duration_seconds > 0 && (
                      <div className="inline-flex items-center gap-1 mt-3 text-sm text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-lg">
                        <Clock size={14} />
                        {Math.floor(step.duration_seconds / 60)} min
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
