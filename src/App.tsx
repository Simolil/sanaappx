import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Heart, BookOpen, RotateCcw, AlertTriangle, ArrowRight, Brain, Sparkles, Sliders } from 'lucide-react';
import { CompanionState, Message, Memory, MoodEntry } from './types';

// Importing Custom Sub-components
import ChatInterface from './components/ChatInterface';
import BreathingExercise from './components/BreathingExercise';
import SynthSoundscape from './components/SynthSoundscape';
import MoodHistory from './components/MoodHistory';
import MemoryConsole from './components/MemoryConsole';

export default function App() {
  const [state, setState] = useState<CompanionState | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'body' | 'journal'>('chat');
  const [onboardName, setOnboardName] = useState<string>('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [newMemoriesAlert, setNewMemoriesAlert] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load the backend state on initial mount
  const fetchState = async () => {
    try {
      setErrorText(null);
      const res = await fetch('/api/companion/state');
      if (!res.ok) throw new Error('Failed to retrieve companion state');
      const data = await res.json();
      setState(data);
    } catch (err: any) {
      console.error(err);
      setErrorText('Could not connect to the companion server. Make sure the server is booted and valid.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Onboard Action
  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardName.trim()) return;
    try {
      setErrorText(null);
      const res = await fetch('/api/companion/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: onboardName.trim() }),
      });
      if (!res.ok) throw new Error('Onboarding request failed');
      const data = await res.json();
      if (data.success) {
        // Reload State (this yields initial model welcome text)
        await fetchState();
      }
    } catch (err: any) {
      setErrorText(err.message || 'Onboarding error');
    }
  };

  // Chat message submission
  const handleSendMessage = async (text: string) => {
    if (!state) return;

    // Locally inject the user message instantly to feel highly responsive
    const localUserMsg: Message = {
      id: 'msg_local_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setState(prev => prev ? {
      ...prev,
      messages: [...prev.messages, localUserMsg]
    } : null);

    try {
      const res = await fetch('/api/companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error('Failed to transmit message to Willow');
      const data = await res.json();
      
      if (data.success) {
        // If background analysis successfully summarized details, pass them to alert channel
        if (data.newMemories && data.newMemories.length > 0) {
          setNewMemoriesAlert(data.newMemories);
        }
        setState(data.state);
      }
    } catch (err: any) {
      setErrorText('Willow is offline or busy. Let’s try again in a second.');
      // Revert the temporary user text if server transmission crashed
      fetchState();
    }
  };

  // Record a Mood Entry check-in
  const handleAddMood = async (score: number, notes: string, triggers: string[]) => {
    try {
      const res = await fetch('/api/companion/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, notes, triggers }),
      });
      if (!res.ok) throw new Error('Failed to record mood entry');
      const data = await res.json();
      if (data.success) {
        setState(data.state);
      }
    } catch (err: any) {
      setErrorText('Could not register mood check-in. Try again.');
    }
  };

  // Erase memory node (Consent and sovereignty)
  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/companion/memories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to erase memory node');
      const data = await res.json();
      if (data.success) {
        setState(data.state);
      }
    } catch (err: any) {
      setErrorText('Could not delete memory card.');
    }
  };

  // Reset companion state
  const handleReset = async () => {
    if (!confirm('Are you absolutely sure you want to reset all conversation histories and memory charts? This will start fresh.')) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/companion/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset request failed');
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        setOnboardName('');
        setActiveTab('chat');
        setNewMemoriesAlert([]);
      }
    } catch (err: any) {
      setErrorText('Error reloading companion state.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-[#8c6239] border-t-transparent rounded-full animate-spin" />
        <p className="font-sans text-xs text-[#8c6239] font-medium tracking-wide mt-4">Opening Willow’s Desk • Breathing deeply...</p>
      </div>
    );
  }

  // Onboarding Screen logic
  if (state && !state.profile.onboardingCompleted) {
    return (
      <div id="onboarding-container" className="min-h-screen bg-[#faf8f3] text-[#4a3f35] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-[#e6dfd5] w-full max-w-sm rounded-[32px] p-8 shadow-sm flex flex-col space-y-6"
        >
          {/* Introductory details */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-100 to-amber-200 border border-amber-300 mx-auto flex items-center justify-center text-amber-900 shadow-none">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            
            <h1 className="font-sans text-xl font-bold tracking-tight text-[#4a3f35]">
              Meet Willow
            </h1>
            <p className="font-sans text-xs text-[#6c5f54] leading-relaxed">
              Unlike static meditation timers (Calm, Headspace) or rigid CBT screens (Wysa, Woebot), <strong className="font-semibold text-amber-900">Willow is a memory-retaining companion</strong>. 
            </p>
            <p className="font-sans text-xs text-[#6c5f54]/90 leading-relaxed bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50">
              As you chat naturally, Willow automatically logs your triggers, preferences, and personal stressors, continuously incorporating them to build a deep, trusted conversational relationship. You have full command of what she remembers.
            </p>
          </div>

          <form onSubmit={handleOnboard} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="font-sans text-xs text-[#6c5f54] font-semibold">What is your first name or nickname?</label>
              <input
                id="onboard-name-input"
                type="text"
                placeholder="Call me..."
                value={onboardName}
                onChange={(e) => setOnboardName(e.target.value)}
                required
                className="w-full bg-[#faf8f5] border border-[#e6dfd5] rounded-2xl py-3 px-4 text-sm font-sans focus:outline-none focus:border-[#8c6239] font-medium text-[#4a3f35]"
              />
            </div>

            {errorText && (
              <div id="onboard-error-box" className="p-3.5 bg-rose-50 text-rose-950 font-medium font-sans text-xs rounded-2xl border border-rose-100 flex items-start gap-2">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-700" />
                <span>{errorText}</span>
              </div>
            )}

            <button
              id="begin-onboard-btn"
              type="submit"
              disabled={!onboardName.trim()}
              className="w-full bg-[#8c6239] hover:bg-[#724f2d] text-white p-3.5 rounded-2xl text-xs font-semibold font-sans transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              Step inside Haven
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#4a3f35] font-sans flex flex-col pb-20">
      
      {/* Top Banner Bar */}
      <header className="bg-white border-b border-[#f0eae1] py-4 px-6 flex items-center justify-between sticky top-0 z-30 shadow-none">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-orange-600 fill-current" />
          <h1 className="font-sans text-sm font-extrabold tracking-tight text-[#4a3f35] flex items-center gap-1.5">
            Willow <span className="font-sans font-medium text-[10px] text-[#8c6239] bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Companion Desk</span>
          </h1>
        </div>

        <button
          id="btn-app-reset"
          onClick={handleReset}
          className="text-[10px] font-sans font-semibold text-[#8c6239] bg-[#faf6f0] border border-[#ede6d9] hover:bg-[#eae1d3] p-1 px-2.5 rounded-xl flex items-center gap-1 transition-all"
          title="Reset onboarding and delete memories database"
        >
          <RotateCcw className="w-3 h-3" /> Clear Desk
        </button>
      </header>

      {/* Main Single Screen Layout Context */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 md:py-6 space-y-6">
        
        {errorText && (
          <div id="app-error-banner" className="p-3 bg-rose-50 text-rose-950 font-sans text-xs rounded-2xl border border-rose-100 flex items-start gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-700 shrink-0" />
            <div className="flex-1">
              <span>{errorText}</span>
              <button onClick={() => setErrorText(null)} className="underline ml-2 font-bold hover:text-rose-900">Dismiss</button>
            </div>
          </div>
        )}

        {/* Floating notifications or Welcome notes banner in Chat */}
        {activeTab === 'chat' && state && (
          <div className="bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-100 p-4 rounded-3xl flex items-start gap-3.5 shadow-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/10 rounded-full blur-xl" />
            <div className="w-9 h-9 bg-white border border-amber-200 rounded-xl flex items-center justify-center text-amber-700 shrink-0">
              <Sparkles className="w-4 h-4 fill-current animate-bounce" />
            </div>
            <div>
              <h3 className="font-sans text-xs font-bold text-amber-950 leading-tight">
                Welcome to Haven, {state.profile.name}
              </h3>
              <p className="font-sans text-[11px] text-amber-900/80 leading-relaxed mt-1">
                As you converse naturally, Willow automatically maps your stressors and useful tactics. Test this memory feature by reviewing the <strong className="font-semibold text-amber-900">My Journals</strong> tab anytime.
              </p>
            </div>
          </div>
        )}

        {/* Tab Swappers Panel Frame */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && state && (
              <motion.div
                key="chat-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <ChatInterface
                  messages={state.messages}
                  newMemoriesAlert={newMemoriesAlert}
                  onSendMessage={handleSendMessage}
                />
              </motion.div>
            )}

            {activeTab === 'body' && state && (
              <motion.div
                key="body-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <BreathingExercise />
                <SynthSoundscape />
              </motion.div>
            )}

            {activeTab === 'journal' && state && (
              <motion.div
                key="journal-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <MoodHistory
                  moodHistory={state.moodHistory}
                  onAddMood={handleAddMood}
                />
                <MemoryConsole
                  memories={state.memories}
                  onDeleteMemory={handleDeleteMemory}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Floating Bottom Navigator for unified touch targets */}
      <nav className="fixed bottom-4 left-4 right-4 md:left-auto md:right-auto md:w-full md:max-w-md mx-auto bg-white/80 backdrop-blur-lg border border-[#f0eae1] p-2 rounded-2xl flex justify-between items-center shadow-md z-40">
        <button
          id="nav-btn-chat"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-xl transition-all ${
            activeTab === 'chat' 
              ? 'bg-[#8c6239] text-[#fdfbf7] shadow-sm' 
              : 'text-[#6c5f54] hover:bg-[#ede6d9]/40'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-sans text-[10px] uppercase tracking-wider font-extrabold mt-1">Talk companion</span>
        </button>

        <button
          id="nav-btn-body"
          onClick={() => setActiveTab('body')}
          className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-xl transition-all ${
            activeTab === 'body' 
              ? 'bg-[#8c6239] text-[#fdfbf7] shadow-sm' 
              : 'text-[#6c5f54] hover:bg-[#ede6d9]/40'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="font-sans text-[10px] uppercase tracking-wider font-extrabold mt-1">Somatic Peace</span>
        </button>

        <button
          id="nav-btn-journal"
          onClick={() => setActiveTab('journal')}
          className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-xl transition-all ${
            activeTab === 'journal' 
              ? 'bg-[#8c6239] text-[#fdfbf7] shadow-sm' 
              : 'text-[#6c5f54] hover:bg-[#ede6d9]/40'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="font-sans text-[10px] uppercase tracking-wider font-extrabold mt-1">My Journals</span>
        </button>
      </nav>

    </div>
  );
}
