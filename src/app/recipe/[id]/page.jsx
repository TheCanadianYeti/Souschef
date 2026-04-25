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
  };

  const handleAskQuestion = () => {
    setIsListening(true);
    setVoiceResponse('');
    setTimeout(() => {
      setIsListening(false);
      setVoiceResponse("For this step, you want the garlic to be fragrant but not browned, so about 30 seconds on medium heat.");
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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brick"></div>
      </div>
    );
  }

  if (!recipe) return <div className="container mx-auto px-4 py-8 text-center text-xl text-ink">Recipe not found.</div>;

  if (isCooking) {
    const currentStep = recipe.steps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / recipe.steps.length) * 100;

    return (
      <div className="fixed inset-0 z-50 bg-page flex flex-col animate-in fade-in duration-500">
        {/* Cooking Header */}
        <div className="p-4 border-b border-parchment-deep flex items-center justify-between glass">
          <button onClick={() => setIsCooking(false)} className="flex items-center gap-2 text-warm-dark hover:text-brick transition-colors font-semibold">
            <ArrowLeft size={20} />
            <span>Exit</span>
          </button>
          <div className="font-bold text-lg text-ink truncate max-w-[200px] sm:max-w-md">{recipe.title}</div>
          <div className="text-sm font-bold text-brick uppercase tracking-wider">
            Step {currentStepIndex + 1} / {recipe.steps.length}
          </div>
        </div>

        {/* Progress Bar - Brick on Parchment */}
        <div className="h-2 bg-parchment-deep w-full">
          <div className="h-full bg-brick transition-all duration-700 ease-in-out" style={{ width: `${progress}%` }} />
        </div>

        {/* Main Cooking View */}
        <div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 max-w-5xl mx-auto w-full relative">
          <div className="absolute top-8 right-8 animate-pulse text-aged-gold hidden sm:flex items-center gap-2">
            <ChefHat size={20} />
            <span className="text-sm font-bold uppercase">Hands-free active</span>
          </div>

          <h2 className="text-3xl sm:text-6xl font-bold leading-tight text-center mb-12 text-ink animate-in slide-in-from-bottom-6 duration-500">
            {currentStep.instruction}
          </h2>

          {currentStep.duration_seconds > 0 && (
            <div className="px-8 py-4 bg-gray-100 dark:bg-gray-800 rounded-full font-mono text-3xl mb-12 text-gray-800 dark:text-gray-200">
              {Math.floor(currentStep.duration_seconds / 60)}:{(currentStep.duration_seconds % 60).toString().padStart(2, '0')}
            </div>
          )}

          {/* Voice Q&A Section */}
          <div className="w-full max-w-md">
            <button
              onClick={handleAskQuestion}
              disabled={isListening}
              className={`w-full py-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 shadow-xl ${isListening ? 'bg-brick text-page ring-4 ring-brick/20' : 'bg-surface-color border-2 border-parchment-deep text-ink hover:border-brick'}`}
            >
              <div className={`p-4 rounded-full ${isListening ? 'bg-page text-brick animate-bounce' : 'bg-parchment text-brick'}`}>
                <Mic size={28} />
              </div>
              <span className="font-bold text-lg">{isListening ? 'Listening...' : 'Ask Souschef'}</span>
            </button>

            {voiceResponse && (
              <div className="mt-8 p-6 bg-aged-gold/10 border border-aged-gold/20 rounded-2xl text-ink animate-in fade-in zoom-in-95 flex gap-4 shadow-sm">
                <ChefHat className="shrink-0 text-aged-gold" size={24} />
                <p className="font-medium leading-relaxed italic">{voiceResponse}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="p-8 border-t border-parchment-deep flex justify-between max-w-5xl mx-auto w-full gap-6">
          <button
            onClick={() => setCurrentStepIndex(p => Math.max(0, p - 1))}
            disabled={currentStepIndex === 0}
            className="flex-1 max-w-[100px] flex items-center justify-center p-5 rounded-2xl border-2 border-parchment-deep disabled:opacity-20 hover:bg-parchment transition-all text-ink"
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={() => {
              if (currentStepIndex === recipe.steps.length - 1) setIsCooking(false);
              else setCurrentStepIndex(p => p + 1);
            }}
            className="flex-grow py-5 bg-brick hover:bg-ink text-page rounded-2xl font-bold text-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
          >
            {currentStepIndex === recipe.steps.length - 1 ? (
              <><Check size={28} /> Finish</>
            ) : (
              <>Next Step <ChevronRight size={28} /></>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* Standard Recipe Detail View */
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-700">
      <Link href="/" className="inline-flex items-center gap-2 text-warm-dark/60 hover:text-brick transition-colors mb-8 font-semibold">
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Image & Primary Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[3/4] relative border-4 border-parchment">
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex gap-2 flex-wrap">
                {recipe.tags.map(tag => (
                  <span key={tag} className="text-xs font-bold px-3 py-1.5 bg-page/20 backdrop-blur-md text-page rounded-full uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleStartCooking}
            className="w-full py-5 bg-brick hover:bg-ink text-page rounded-3xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-brick/20 hover:-translate-y-1 active:translate-y-0"
          >
            <Play size={24} fill="currentColor" />
            Start Cooking Mode
          </button>
        </div>

        {/* Right Column: Info & Ingredients */}
        <div className="lg:col-span-7">
          <h1 className="text-5xl font-bold mb-4 text-ink tracking-tight leading-tight">{recipe.title}</h1>
          <p className="text-xl text-warm-dark/70 mb-10 leading-relaxed font-medium">{recipe.description}</p>

          <div className="flex flex-wrap gap-8 p-8 bg-parchment/50 border border-parchment-deep rounded-[2rem] mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-brick/10 text-brick rounded-2xl"><Clock size={24} /></div>
              <div>
                <p className="text-xs text-warm-dark/50 uppercase font-bold tracking-widest">Total Time</p>
                <p className="text-lg font-bold text-ink">{recipe.prep_time + recipe.cook_time} mins</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-aged-gold/10 text-aged-gold rounded-2xl"><Users size={24} /></div>
              <div>
                <p className="text-xs text-warm-dark/50 uppercase font-bold tracking-widest">Servings</p>
                <p className="text-lg font-bold text-ink">{recipe.servings * servingsMultiplier}</p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-parchment-deep pb-6 gap-4">
              <h2 className="text-3xl font-bold text-ink tracking-tight">Ingredients</h2>
              <div className="flex items-center gap-2 bg-parchment-deep/40 p-1.5 rounded-2xl border border-parchment-deep">
                {[1, 2, 3].map(m => (
                  <button
                    key={m}
                    onClick={() => { setServingsMultiplier(m); setIsCustomMultiplier(false); }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${servingsMultiplier === m && !isCustomMultiplier ? 'bg-ink text-page shadow-md' : 'text-warm-dark hover:bg-parchment'}`}
                  >
                    {m}x
                  </button>
                ))}
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recipe.ingredients.map(ing => (
                <li key={ing.id} className="flex justify-between items-center p-4 rounded-2xl bg-surface-color border border-parchment-deep/50 hover:border-brick/30 transition-colors group">
                  <span className="text-ink font-semibold group-hover:text-brick">{ing.name}</span>
                  <span className="font-bold text-warm-dark opacity-60">
                    {(parseFloat(ing.quantity) * servingsMultiplier).toLocaleString()} {ing.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-ink mb-8 border-b border-parchment-deep pb-6 tracking-tight">Preparation</h2>
            <div className="space-y-8">
              {recipe.steps.map((step, idx) => (
                <div key={step.id} className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-ink text-page flex items-center justify-center font-bold text-lg shrink-0 shadow-md group-hover:bg-brick transition-colors">
                      {idx + 1}
                    </div>
                    {idx < recipe.steps.length - 1 && <div className="w-0.5 h-full bg-parchment-deep my-2" />}
                  </div>
                  <div className="pb-8 pt-1">
                    <p className="text-xl text-ink leading-relaxed font-medium">{step.instruction}</p>
                    {step.duration_seconds > 0 && (
                      <div className="inline-flex items-center gap-2 mt-4 text-sm text-brick font-bold bg-brick/5 px-4 py-2 rounded-xl border border-brick/10">
                        <Clock size={16} />
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