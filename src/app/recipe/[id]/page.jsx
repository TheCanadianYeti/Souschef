"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { fetchRecipeById, deleteLocalRecipe } from '../../../data/mockRecipes';
import { Clock, Users, Play, Pause, ShoppingCart, ArrowLeft, Mic, ChevronRight, ChevronLeft, Check, ChefHat, Minimize2, Trash2, AlertCircle, Link as LinkIcon, Volume2 } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
  const [mounted, setMounted] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  const [stepAudio, setStepAudio] = useState(null);
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const [diag, setDiag] = useState({ backend: 'checking...', mic: 'unknown', speech: 'unknown' });
  const [recipeReady, setRecipeReady] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleImageError = () => {
    if (retryCount === 0 && recipe) {
      const tag = recipe.tags && recipe.tags[0] ? recipe.tags[0] : 'cooking';
      setImgSrc(`https://loremflickr.com/800/600/food,${encodeURIComponent(tag)}/all?sig=${recipe.id}`);
      setRetryCount(1);
    } else if (retryCount === 1) {
      setImgSrc(`https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80`);
      setRetryCount(2);
    }
  };

  useEffect(() => {
    if (recipe) setImgSrc(recipe.image_url);
  }, [recipe]);


  // Refs so callbacks (onend, executeChefCommand) always see live values,
  // not stale closures captured at effect-setup time.
  const currentStepIndexRef = useRef(currentStepIndex);
  const isAssistantEnabledRef = useRef(isAssistantEnabled);
  const isProcessingCommandRef = useRef(isProcessingCommand);
  const isCookingRef = useRef(isCooking);
  const recipeRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentAudioRef = useRef(null);
  const ttsAbortControllerRef = useRef(null);
  const isSpeakingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { currentStepIndexRef.current = currentStepIndex; }, [currentStepIndex]);
  useEffect(() => { isAssistantEnabledRef.current = isAssistantEnabled; }, [isAssistantEnabled]);
  useEffect(() => { isProcessingCommandRef.current = isProcessingCommand; }, [isProcessingCommand]);
  useEffect(() => { isCookingRef.current = isCooking; }, [isCooking]);
  useEffect(() => { recipeRef.current = recipe; }, [recipe]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const checkStatus = async () => {
        const s = {
          speech: (window.SpeechRecognition || window.webkitSpeechRecognition) ? 'Supported' : 'NOT Supported',
          mic: 'Unknown',
          backend: 'checking...'
        };

        try {
          const baseUrl = API_BASE_URL.replace(/\/$/, '');
          const res = await fetch(`${baseUrl}/health`, { credentials: 'include' });
          s.backend = res.ok ? 'Connected' : `Error: ${res.status}`;
        } catch (e) {
          s.backend = 'Disconnected';
        }

        try {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          s.mic = permission.state;
        } catch (e) {
          s.mic = 'Unknown';
        }

        setDiag(s);
      };
      checkStatus();
    }
  }, [mounted, isCooking]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchRecipeById(id);
        if (data) setRecipe(data);
      } catch (err) {
        console.error('Failed to load recipe:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mounted) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      addLog('Microphone listening...');
    };
    recognition.onerror = (e) => {
      addLog(`Mic error: ${e.error}`);
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      // If we are not in cooking mode or are currently speaking, ignore the results
      if (!isCookingRef.current || isSpeakingRef.current) return;

      const transcript = event.results[0][0].transcript.toLowerCase();
      addLog(`Heard: "${transcript}"`);
      if (transcript.includes('chef')) {
        const cleanCommand = transcript
          .replace(/hey chef|hi chef|chef/g, '')
          .replace(/^[,.\s]+/, '')
          .trim();
        executeChefCommand(cleanCommand || 'repeat');
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      // Use refs — not closed-over state — so we always read live values.
      if (isCookingRef.current && isAssistantEnabledRef.current && !isProcessingCommandRef.current) {
        try { recognition.start(); } catch(e) {}
      }
    };

    setSpeechRecognition(recognition);

    return () => {
      try { recognition.abort(); } catch(e) {}
      recognitionRef.current = null;
    };
  }, [mounted]); // Only (re)create when mounted — refs handle live state

  // Explicit effect to restart recognition when processing ends
  useEffect(() => {
    if (isCooking && isAssistantEnabled && !isProcessingCommand && speechRecognition && !isListening) {
      try { speechRecognition.start(); } catch (e) { }
    }
  }, [isProcessingCommand, isCooking, isAssistantEnabled, speechRecognition, isListening]);

  // Start recognition when assistant is first enabled during cooking
  useEffect(() => {
    if (isCooking && isAssistantEnabled && speechRecognition) {
      try { speechRecognition.start(); } catch(e) {}
    } else if (speechRecognition) {
      // Force stop if not cooking OR if assistant is disabled
      try { speechRecognition.abort(); } catch(e) {}
    }
  }, [isCooking, isAssistantEnabled, speechRecognition]);

  useEffect(() => {
    if (isCooking && recipe && recipe.steps[currentStepIndex]) {
      const step = recipe.steps[currentStepIndex];
      
      // Update timer for the new step
      setTimerLeft(step.duration_seconds || 0);
      setIsTimerRunning(false);

      // Delayed audio narration
      const timer = setTimeout(() => {
        playStepAudio(`Step ${currentStepIndex + 1}: ${step.instruction}`);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isCooking, recipe]);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timerLeft > 0) {
      interval = setInterval(() => setTimerLeft((prev) => prev - 1), 1000);
    } else if (timerLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playChime();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerLeft]);

  // Global stop helper
  const stopAllAudio = () => {
    if (stepAudio) {
      stepAudio.pause();
      stepAudio.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const addLog = (msg) => {
    console.log(`[Chef-Debug] ${msg}`);
    setDebugLog(prev => [msg, ...prev].slice(0, 5));
  };

  const playStepAudio = async (text, onEndedCallback) => {
    // 1. Cancel any pending fetch
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    ttsAbortControllerRef.current = abortController;

    // 2. Stop any existing audio immediately
    stopAllAudio();
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = ""; // Force stop loading
      } catch (e) {}
      currentAudioRef.current = null;
    }

    if (isProcessingCommandRef.current && !text.includes('Step')) {
      addLog("Audio blocked: already processing");
      return;
    }

    isSpeakingRef.current = true;
    try {
      const baseUrl = API_BASE_URL.replace(/\/$/, '');
      addLog(`Requesting TTS...`);
      const response = await fetch(`${baseUrl}/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text }),
        signal: abortController.signal
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        isSpeakingRef.current = false;
        if (onEndedCallback) onEndedCallback();
      };
      audio.onerror = () => {
        isSpeakingRef.current = false;
        if (onEndedCallback) onEndedCallback();
      };

      await audio.play();
      addLog('ElevenLabs Playing');
    } catch (err) {
      if (err.name === 'AbortError') {
        addLog('TTS Request Aborted');
        return;
      }
      addLog(`TTS Failed, using Browser`);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => { isSpeakingRef.current = true; };
        utterance.onend = () => { 
          isSpeakingRef.current = false;
          if (onEndedCallback) onEndedCallback();
        };
        utterance.onerror = () => {
          isSpeakingRef.current = false;
          if (onEndedCallback) onEndedCallback();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        isSpeakingRef.current = false;
        if (onEndedCallback) onEndedCallback();
      }
    }
  };

  const executeChefCommand = async (commandText) => {
    // Use ref so we always read the current step index, not a stale closure
    const stepIndex = currentStepIndexRef.current;
    addLog(`Chef heard: "${commandText}" (step ${stepIndex})`);
    setIsProcessingCommand(true);
    setVoiceResponse('Thinking...');

    // Safety unlock — extended to 8s to not race normal TTS playback
    const safetyTimer = setTimeout(() => setIsProcessingCommand(false), 8000);

    try {
      const baseUrl = API_BASE_URL.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/assistant/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ commandText, recipeData: recipeRef.current, currentStepIndex: stepIndex })
      });

      if (!response.ok) throw new Error(`Assistant Error: ${response.status}`);

      const data = await response.json();
      addLog(`Action: ${data.action}`);
      setVoiceResponse(data.replyText);

      // Perform navigation IMMEDIATELY, don't wait for audio
      if (data.action === 'NEXT_STEP') {
        setCurrentStepIndex(prev => {
          const next = Math.min(prev + 1, recipeRef.current.steps.length - 1);
          currentStepIndexRef.current = next;
          return next;
        });
      } else if (data.action === 'PREVIOUS_STEP') {
        setCurrentStepIndex(prev => {
          const next = Math.max(prev - 1, 0);
          currentStepIndexRef.current = next;
          return next;
        });
      }

      // Play audio; clear safety timer on completion
      playStepAudio(data.replyText, () => {
        clearTimeout(safetyTimer);
        setIsProcessingCommand(false);
      });


    } catch (error) {
      clearTimeout(safetyTimer);
      addLog(`Error: ${error.message}`);
      setVoiceResponse("I'm sorry, I couldn't reach the AI. Try saying 'Next step' again.");
      setIsProcessingCommand(false);
    }
  };

  const handleStartCooking = async () => {
    setIsCooking(true);
    setCurrentStepIndex(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) { }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();
    }
  };

  const handleToggleAssistant = () => {
    const newState = !isAssistantEnabled;
    setIsAssistantEnabled(newState);
    if (!newState) {
      if (speechRecognition) try { speechRecognition.stop(); } catch (e) { }
      setVoiceResponse('');
    } else {
      setVoiceResponse("Listening...");
      playStepAudio("Hands-free mode active.");
    }
  };

  const handleExitCooking = () => {
    setIsCooking(false);
    setIsAssistantEnabled(false);
    stopAllAudio();
  };

  const handleDelete = async () => {
    try {
      console.log(`[DEBUG] Starting deletion for recipe ID: ${id}`);
      
      // 1. Always remove from localStorage first (catches local-only recipes)
      deleteLocalRecipe(id);
      console.log(`[DEBUG] Removed from localStorage`);

      // 2. Only attempt to delete from backend DB if it's a real UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(id)) {
        console.log(`[DEBUG] Valid UUID detected, calling backend...`);
        // Use clean API_BASE_URL
        const baseUrl = API_BASE_URL.replace(/\/$/, '');
        await axios.delete(`${baseUrl}/recipes/${id}`, {
          withCredentials: true
        });
        console.log(`[DEBUG] Backend deletion successful`);
      } else {
        console.log(`[DEBUG] Not a UUID, skipping backend call`);
      }

      // 3. Force a full page reload to clear any client-side caches
      console.log(`[DEBUG] Redirecting to dashboard...`);
      window.location.href = '/';
      
    } catch (err) {
      console.error('[DEBUG] Deletion process failed:', err);
      // Still redirect so the user isn't stuck
      window.location.href = '/';
    }
  };


  if (!mounted || loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-color"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Recipe not found</h2>
        <Link href="/" className="text-brick hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  if (isCooking) {
    const currentStep = recipe.steps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / recipe.steps.length) * 100;

    return (
      <div className="fixed inset-0 z-50 flex flex-col animate-in fade-in duration-500 overflow-y-auto" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="p-4 border-b border-border-color flex items-center justify-between glass">
          <button onClick={handleExitCooking} className="flex items-center gap-2 text-text-secondary hover:text-accent-color transition-colors font-semibold">
            <ArrowLeft size={20} />
            <span>Exit</span>
          </button>
          <div className="font-bold text-lg text-text-primary truncate max-w-[200px] sm:max-w-md">{recipe.title}</div>
          <div className="text-sm font-bold text-accent-color uppercase tracking-wider">
            Step {currentStepIndex + 1} / {recipe.steps.length}
          </div>
        </div>

        {/* Progress Bar - Brick on Parchment */}
        <div className="h-2 w-full" style={{ backgroundColor: 'var(--border-color)' }}>
          <div className="h-full bg-accent-color transition-all duration-700 ease-in-out" style={{ width: `${progress}%` }} />
        </div>

        {/* Main Cooking View */}
        <div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 max-w-5xl mx-auto w-full relative min-h-fit">
          <div className={`absolute top-8 right-8 ${isAssistantEnabled ? 'animate-pulse text-accent-color' : 'text-text-muted opacity-30'} hidden sm:flex items-center gap-2 transition-all`}>
            <ChefHat size={20} />
            <span className="text-sm font-bold uppercase">{isAssistantEnabled ? 'Hands-free active' : 'Voice assistant off'}</span>
          </div>

          <div className="flex items-center justify-center gap-4 mb-12 group">
            <h2 className="text-3xl sm:text-6xl font-bold leading-tight text-center text-text-primary animate-in slide-in-from-bottom-6 duration-500">
              {currentStep.instruction}
            </h2>
            <button 
              onClick={() => playStepAudio(currentStep.instruction)}
              className="p-3 rounded-full bg-surface-color border border-border-color text-accent-color hover:bg-accent-color hover:text-page transition-all shadow-sm"
              title="Read instruction"
            >
              <Volume2 size={24} />
            </button>
          </div>

          {currentStep.duration_seconds > 0 && (
            <div className="flex flex-col items-center gap-6 mb-12">
              <div className="px-12 py-6 bg-surface-color border-4 border-border-color rounded-[2rem] font-mono text-6xl text-text-primary shadow-inner flex items-center justify-center min-w-[280px]">
                {Math.floor(timerLeft / 60)}:{(timerLeft % 60).toString().padStart(2, '0')}
              </div>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="flex items-center gap-2 px-8 py-3 bg-accent-color text-page rounded-2xl shadow-lg hover:opacity-80 transition-all active:scale-95 font-bold uppercase tracking-wider"
              >
                {isTimerRunning ? (
                  <>
                    <Pause size={24} fill="currentColor" />
                    <span>Pause Timer</span>
                  </>
                ) : (
                  <>
                    <Play size={24} fill="currentColor" />
                    <span>{timerLeft === currentStep.duration_seconds ? 'Start Timer' : 'Resume Timer'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Voice Q&A Section */}
          <div className="w-full max-w-md">
            <button
              onClick={handleToggleAssistant}
              className={`w-full py-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 shadow-xl ${isAssistantEnabled ? 'bg-accent-color text-page ring-4 ring-accent-color/20' : 'bg-surface-color border-2 border-border-color text-text-primary hover:border-accent-color'}`}
            >
              <div className={`p-4 rounded-full ${isAssistantEnabled ? 'bg-surface-color text-accent-color animate-bounce' : 'bg-border-color text-accent-color'}`}>
                {isAssistantEnabled ? <Mic size={28} /> : <Mic size={28} className="opacity-50" />}
              </div>
              <span className="font-bold text-lg">{isAssistantEnabled ? 'Listening (Say "Hey Chef")' : 'Enable Hands-free'}</span>
            </button>

            {voiceResponse && (
              <div className="mt-8 p-6 bg-aged-gold/10 border border-aged-gold/20 rounded-2xl text-text-primary animate-in fade-in zoom-in-95 flex gap-4 shadow-sm">
                <ChefHat className="shrink-0 text-aged-gold" size={24} />
                <p className="font-medium leading-relaxed italic">{voiceResponse}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="p-8 border-t border-border-color flex justify-between max-w-5xl mx-auto w-full gap-6">
          <button
            onClick={() => setCurrentStepIndex(p => Math.max(0, p - 1))}
            disabled={currentStepIndex === 0}
            className="flex-1 max-w-[100px] flex items-center justify-center p-5 rounded-2xl border-2 border-border-color disabled:opacity-20 hover:bg-surface-color transition-all text-text-primary"
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={() => {
              if (currentStepIndex === recipe.steps.length - 1) handleExitCooking();
              else setCurrentStepIndex(p => p + 1);
            }}
            className="flex-grow py-5 bg-accent-color hover:opacity-80 text-page rounded-2xl font-bold text-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
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
      <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent-color transition-colors mb-8 font-semibold opacity-60 hover:opacity-100">
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Image & Primary Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[3/4] relative border-4 border-border-color">
            <img 
              src={imgSrc || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'} 
              alt={recipe.title} 
              onError={handleImageError}
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex gap-2 flex-wrap">
                {recipe.tags && recipe.tags.map(tag => (
                  <span key={tag} className="text-xs font-bold px-3 py-1.5 bg-page/20 backdrop-blur-md text-page rounded-full uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Source Link Underneath Image */}
          {recipe.source_url && (
            <a 
              href={recipe.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 py-5 px-6 bg-surface-color border-2 border-border-color rounded-[2rem] text-accent-color font-bold text-lg hover:border-accent-color hover:bg-accent-color/5 transition-all shadow-sm hover:-translate-y-1 active:translate-y-0"
            >
              <LinkIcon size={20} />
              View Original Source
            </a>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleStartCooking}
              className="w-full py-5 bg-accent-color hover:opacity-80 text-page rounded-3xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-accent-color/20 hover:-translate-y-1 active:translate-y-0"
            >
              <Play size={24} fill="currentColor" />
              Start Cooking Mode
            </button>
            
            {/* Remove Item Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-4 border-2 border-red-500/20 hover:border-red-500/50 text-red-500/60 hover:text-red-500 rounded-3xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-red-500/5 active:scale-[0.98]"
            >
              <Trash2 size={20} />
              Remove Recipe
            </button>
          </div>


        </div>

        {/* Right Column: Info & Ingredients */}
        <div className="lg:col-span-7">
          <h1 className="text-5xl font-bold mb-4 text-text-primary tracking-tight leading-tight">{recipe.title}</h1>
          <p className="text-xl text-text-secondary mb-10 leading-relaxed font-medium opacity-75">{recipe.description}</p>

          <div className="flex flex-wrap gap-8 p-8 bg-surface-color border border-border-color rounded-[2rem] mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-accent-color/10 text-accent-color rounded-2xl"><Clock size={24} /></div>
              <div>
                <p className="text-xs text-text-secondary uppercase font-bold tracking-widest opacity-50">Total Time</p>
                <p className="text-lg font-bold text-text-primary">{recipe.prep_time + recipe.cook_time} mins</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-aged-gold/10 text-aged-gold rounded-2xl"><Users size={24} /></div>
              <div>
                <p className="text-xs text-text-secondary uppercase font-bold tracking-widest opacity-50">Servings</p>
                <p className="text-lg font-bold text-text-primary">{recipe.servings * servingsMultiplier}</p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-border-color pb-6 gap-4">
              <h2 className="text-3xl font-bold text-text-primary tracking-tight">Ingredients</h2>
              <div className="flex items-center gap-2 bg-surface-color p-1.5 rounded-2xl border border-border-color">
                {[1, 2, 3].map(m => (
                  <button
                    key={m}
                    onClick={() => { setServingsMultiplier(m); setIsCustomMultiplier(false); }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${servingsMultiplier === m && !isCustomMultiplier ? 'bg-text-primary text-page shadow-md' : 'text-text-secondary hover:bg-border-color'}`}
                  >
                    {m}x
                  </button>
                ))}
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recipe.ingredients.map(ing => (
                <li key={ing.id} className="flex justify-between items-center p-4 rounded-2xl bg-surface-color border border-border-color/50 hover:border-accent-color/30 transition-colors group">
                  <span className="text-text-primary font-semibold group-hover:text-accent-color">{ing.name}</span>
                  <span className="font-bold text-text-secondary opacity-60">
                    {(parseFloat(ing.quantity) * servingsMultiplier).toLocaleString()} {ing.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-8 border-b border-border-color pb-6 tracking-tight">Preparation</h2>
            <div className="space-y-8">
              {recipe.steps && recipe.steps.length > 0 ? (
                recipe.steps.map((step, idx) => (
                  <div key={step.id} className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 shadow-md group-hover:bg-accent-color transition-colors"
                        style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-color)' }}
                      >
                        {idx + 1}
                      </div>
                      {idx < recipe.steps.length - 1 && (
                        <div className="w-0.5 flex-1 min-h-8 bg-border-color mt-2" />
                      )}
                    </div>
                    <div className="pb-8 pt-1 flex-grow">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-xl text-text-primary leading-relaxed font-medium">{step.instruction}</p>
                        <button 
                          onClick={() => playStepAudio(step.instruction)}
                          className="mt-1 p-2 rounded-full bg-page text-accent-color hover:bg-accent-color hover:text-page transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Read step"
                        >
                          <Volume2 size={18} />
                        </button>
                      </div>
                      {step.duration_seconds > 0 && (
                        <div className="inline-flex items-center gap-2 mt-4 text-sm text-accent-color font-bold bg-accent-color/5 px-4 py-2 rounded-xl border border-accent-color/10">
                          <Clock size={16} />
                          {Math.floor(step.duration_seconds / 60)} min
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 bg-surface-color border-2 border-dashed border-border-color rounded-[2.5rem] text-center">
                  <p className="text-2xl font-bold text-text-primary mb-2">No detailed steps found</p>
                  <p className="text-xl text-text-secondary opacity-60 italic">Please refer to the original source for full cooking instructions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-color border-2 border-border-color rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-text-primary text-center mb-3">Delete Recipe?</h3>
            <p className="text-text-secondary text-center mb-8 leading-relaxed">
              This will permanently remove <span className="font-bold text-text-primary">"{recipe.title}"</span> from your collection. This action cannot be undone.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20"
              >
                Delete Forever
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-4 bg-transparent hover:bg-border-color text-text-secondary rounded-2xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}