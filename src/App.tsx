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

const COMPANION_QUOTES = [
  "You showed up today — that alone is more than enough.",
  "This is your safe ground. Let yourself breathe.",
  "Whatever you are carrying, we can sit with it together.",
  "Even small steps in the dark are still steps forward.",
  "You are allowed to go slow. There is no rush here.",
  "Every feeling is valid. Let it flow, let it pass.",
  "The heavy times don't hold the final word.",
  "You are so much larger than your anxious thoughts.",
  "It is okay to rest. Rest is where healing begins.",
  "You deserve absolute gentleness — especially from yourself.",
  "One slow breath at a time is the perfect speed.",
  "Something peaceful is still possible for you today."
];

export default function App() {
  const [state, setState] = useState<CompanionState | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'body' | 'journal'>('home');
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
        return data.state;
      }
    } catch (err: any) {
      setErrorText('Could not register mood check-in. Try again.');
    }
    return null;
  };

  // Dynamic Mood click flow carrying reassurance
  const handleMoodSelectAndReassure = async (score: number, label: string) => {
    try {
      // Record in logs
      await handleAddMood(score, `Dashboard checked as: ${label}`, []);
      
      // Auto-dispatch comforting message query in Chat tab
      setActiveTab('chat');
      await handleSendMessage(`I am checking in right now. I feel so ${label.toLowerCase()}.`);
    } catch (e) {
      console.error(e);
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
        setActiveTab('home');
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
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-sage border-t-transparent rounded-full animate-spin" />
        <p className="font-sans text-xs text-sage-dark font-medium tracking-wide mt-4">Opening Willow’s Desk • Breathing deeply...</p>
      </div>
    );
  }

  // Onboarding Screen logic
  if (state && !state.profile.onboardingCompleted) {
    return (
      <div id="onboarding-container" className="min-h-screen bg-cream text-earth-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-warm border border-sage-soft w-full max-w-sm rounded-[32px] p-8 shadow-sm flex flex-col space-y-6"
        >
          {/* Introductory details */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sage-soft to-sage-pale border border-sage-soft mx-auto flex items-center justify-center text-sage-dark shadow-none">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            
            <h1 className="font-serif text-2xl font-bold tracking-tight text-earth-dark">
              Meet Willow
            </h1>
            <p className="font-sans text-xs text-earth-muted leading-relaxed">
              Unlike static meditation timers (Calm, Headspace) or rigid CBT screens (Wysa, Woebot), <strong className="font-semibold text-sage-dark">Willow is a memory-retaining companion</strong>. 
            </p>
            <p className="font-sans text-xs text-earth-muted/90 leading-relaxed bg-cream p-4 rounded-2xl border border-sage-soft/60">
              As you chat naturally, Willow automatically logs your triggers, preferences, and personal stressors, continuously incorporating them to build a deep, trusted conversational relationship. You have full command of what she remembers.
            </p>
          </div>

          <form onSubmit={handleOnboard} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="font-sans text-xs text-earth-muted font-semibold font-sans">What is your first name or nickname?</label>
              <input
                id="onboard-name-input"
                type="text"
                placeholder="Call me..."
                value={onboardName}
                onChange={(e) => setOnboardName(e.target.value)}
                required
                className="w-full bg-cream border border-sage-soft/60 rounded-2xl py-3 px-4 text-sm font-sans focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-soft/50 font-medium text-earth-dark"
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
              className="w-full bg-sage hover:bg-sage-dark text-white p-3.5 rounded-2xl text-xs font-bold font-sans transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
    <div className="min-h-screen bg-cream text-earth-dark font-sans flex flex-col pb-24">
      
      {/* Top Banner Bar */}
      <header className="bg-warm border-b border-sage-soft/40 py-4 px-6 flex items-center justify-between sticky top-0 z-30 shadow-none">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌙</span>
          <h1 className="font-serif text-xl font-bold tracking-tight text-sage-dark flex items-center gap-1.5">
            haven
          </h1>
        </div>

        <button
          id="btn-app-reset"
          onClick={handleReset}
          className="text-[10px] font-sans font-bold text-earth-muted bg-cream border border-sage-soft/40 hover:bg-sage-pale p-1.5 px-3 rounded-xl flex items-center gap-1 transition-all cursor-pointer animate-none"
          title="Reset onboarding and delete memories database"
        >
          <RotateCcw className="w-3 h-3 text-sage-dark" /> Reset Haven
        </button>
      </header>

      {/* Main Single Screen Layout Context */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 md:py-6 space-y-6">
        
        {errorText && (
          <div id="app-error-banner" className="p-3 bg-rose-50 text-rose-950 font-sans text-xs rounded-2xl border border-rose-100 flex items-start gap-2 animate-bounce">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-700 shrink-0" />
            <div className="flex-1">
              <span>{errorText}</span>
              <button onClick={() => setErrorText(null)} className="underline ml-2 font-bold hover:text-rose-900">Dismiss</button>
            </div>
          </div>
        )}

        {/* Tab Swappers Panel Frame */}
        <div className="relative">
          <AnimatePresence mode="wait">
            
            {/* HOME VIEW (Purely separated representation of greeting, cards and mood checks) */}
            {activeTab === 'home' && state && (() => {
              const hour = new Date().getHours();
              const partOfDay = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
              const partEmoji = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
              const quoteIndex = new Date().getDate() % COMPANION_QUOTES.length;
              const rotatedQuote = COMPANION_QUOTES[quoteIndex];

              const listMemories = state.memories || [];
              const latestMemory = listMemories.length > 0 ? listMemories[listMemories.length - 1] : null;

              // Render weekly trend bars for the 7 columns representing local history
              const barDaysArray = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
              const currentWeekdayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // adjusted
              
              // Map recent scores or fall back to beautiful empty states
              const chartMoodData = barDaysArray.map((day, index) => {
                const dayMoods = (state.moodHistory || []).filter(m => {
                  const dayNum = new Date(m.timestamp).getDay();
                  const adjDay = dayNum === 0 ? 6 : dayNum - 1;
                  return adjDay === index;
                });
                const avg = dayMoods.length > 0 
                  ? dayMoods.reduce((sum, current) => sum + current.score, 0) / dayMoods.length 
                  : 0;
                return { key: day, value: avg, isToday: index === currentWeekdayIndex };
              });

              return (
                <motion.div
                  key="home-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  
                  {/* Dynamic Beautiful Greeting Card */}
                  <div className="relative overflow-hidden bg-sage text-white rounded-[28px] p-6 shadow-sm flex flex-col justify-between min-h-[180px]">
                    <div className="absolute right-0 top-0 w-36 h-36 bg-white/5 rounded-full blur-xl -mr-12 -mt-12" />
                    <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-sage-dark/20 rounded-full blur-lg" />
                    
                    <div className="relative z-10">
                      <div className="text-2xl mb-2">{partEmoji}</div>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-sage-soft/90 mb-1">
                        {partOfDay}
                      </div>
                      <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                        {rotatedQuote}
                      </h2>
                    </div>

                    <div className="mt-5 flex gap-2 relative z-10">
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="bg-white hover:bg-sage-pale text-sage-dark font-sans font-bold text-xs px-4 py-2.5 rounded-full cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                      >
                        💬 Talk to Willow
                      </button>
                      <button
                        onClick={() => setActiveTab('body')}
                        className="bg-white/15 hover:bg-white/25 border border-white/20 text-white font-sans font-medium text-xs px-3.5 py-2.5 rounded-full cursor-pointer transition-all"
                      >
                        🌬️ Breathe
                      </button>
                    </div>
                  </div>

                  {/* Immediate Heartcheck Grid Selector */}
                  <div className="bg-white border border-sage-soft/50 p-5 rounded-[26px] shadow-sm animate-none">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xs font-bold text-earth-dark flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                          How is your heart right now?
                        </span>
                        <p className="text-[10px] text-earth-muted mt-0.5 font-sans font-medium">Willow adapts to whatever you register.</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-sage bg-sage-pale px-2.5 py-0.5 rounded-xl">
                        Quick check
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2.5">
                      {[
                        { val: 1, label: 'Low', emoji: '😔', color: 'hover:bg-rose-50 hover:border-rose-200 border-sage-soft/40 bg-warm/45 text-earth-dark font-sans' },
                        { val: 2, label: 'Anxious', emoji: '😰', color: 'hover:bg-amber-50 hover:border-amber-200 border-sage-soft/40 bg-warm/45 text-earth-dark font-sans' },
                        { val: 3, label: 'Tired', emoji: '🥱', color: 'hover:bg-sage-pale hover:border-sage-soft border-sage-soft/40 bg-warm/45 text-earth-dark font-sans' },
                        { val: 4, label: 'Okay', emoji: '😌', color: 'hover:bg-sage-pale hover:border-sage border-sage-soft/40 bg-warm/45 text-earth-dark font-sans' },
                        { val: 5, label: 'Good', emoji: '😊', color: 'hover:bg-sage-pale hover:border-sage-dark border-sage-soft/40 bg-warm/45 text-earth-dark font-sans' }
                      ].map(m => (
                        <button
                          key={m.val}
                          onClick={() => handleMoodSelectAndReassure(m.val, m.label)}
                          className={`flex flex-col items-center gap-1 p-2.5 border rounded-2xl transition-all hover:scale-102 active:scale-97 cursor-pointer bg-white ${m.color}`}
                        >
                          <span className="text-xl">{m.emoji}</span>
                          <span className="text-[9.5px] font-bold text-earth-muted tracking-tight">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dual-gradient "Willow remembers" Card */}
                  <div
                    onClick={() => setActiveTab('journal')}
                    className="group cursor-pointer relative overflow-hidden bg-gradient-to-br from-ocean-dark to-sage text-white p-5 rounded-[26px] shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="absolute right-3 top-3 opacity-10">
                      <Brain className="w-14 h-14" />
                    </div>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffffff] bg-white/10 px-2.5 py-0.5 rounded-md">
                        💭 Willow remembers
                      </span>
                    </div>
                    <p className="font-sans text-xs text-cream/90 leading-relaxed font-medium italic">
                      {latestMemory
                        ? `"${latestMemory.description}"`
                        : '"We haven’t mapped any stressors yet. Let’s talk inside the chat tab, and I will safely record key stressors to support you."'}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-[9px] text-sage-pale/80 font-bold tracking-widest uppercase">
                      <span>{listMemories.length} details logged securely</span>
                      <span className="group-hover:translate-x-1 transition-transform">Audit journal →</span>
                    </div>
                  </div>

                  {/* Ambient sound quick shortcut presets */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-earth-dark px-1">Comforting Sound Presets</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div 
                        onClick={() => { setActiveTab('body'); }}
                        className="cursor-pointer bg-white border border-sage-soft/50 hover:bg-sage-pale/40 rounded-[22px] p-4 flex flex-col items-center gap-2 transition-all hover:scale-102"
                      >
                        <div className="w-9 h-9 rounded-full bg-ocean-soft flex items-center justify-center text-lg">🌧️</div>
                        <span className="text-[11px] font-bold text-earth-dark">Rain Synth</span>
                        <span className="text-[9px] text-earth-muted tracking-wide">Steady, grounding</span>
                      </div>
                      
                      <div 
                        onClick={() => { setActiveTab('body'); }}
                        className="cursor-pointer bg-white border border-sage-soft/50 hover:bg-sage-pale/40 rounded-[22px] p-4 flex flex-col items-center gap-2 transition-all hover:scale-102"
                      >
                        <div className="w-9 h-9 rounded-full bg-sage-soft flex items-center justify-center text-lg">🌲</div>
                        <span className="text-[11px] font-bold text-earth-dark">Forest Synth</span>
                        <span className="text-[9px] text-earth-muted tracking-wide">Natural rustles</span>
                      </div>

                      <div 
                        onClick={() => { setActiveTab('body'); }}
                        className="cursor-pointer bg-white border border-sage-soft/50 hover:bg-sage-pale/40 rounded-[22px] p-4 flex flex-col items-center gap-2 transition-all hover:scale-102"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#f3e5f5] flex items-center justify-center text-lg">🎹</div>
                        <span className="text-[11px] font-bold text-earth-dark">Space Drone</span>
                        <span className="text-[9px] text-earth-muted tracking-wide">Slow harmony</span>
                      </div>
                    </div>
                  </div>

                  {/* Home Streak and Weekly Trend bars */}
                  <div className="bg-white border border-sage-soft/50 rounded-[26px] p-5 shadow-xs">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🌱</span>
                        <span className="text-xs font-bold text-earth-dark">This week’s trend</span>
                      </div>
                      <span className="text-[10px] text-earth-muted font-bold tracking-wide">
                        Streak: {chartMoodData.filter(d => d.value > 0).length} check-ins
                      </span>
                    </div>

                    <div className="flex gap-1.5 items-end justify-between h-14 md:h-16">
                      {chartMoodData.map((d, i) => {
                        const hasValue = d.value > 0;
                        const barHeight = hasValue ? Math.round((d.value / 5) * 44) + 6 : 4;
                        const barColor = d.isToday 
                          ? 'bg-sage' 
                          : d.value >= 4 
                            ? 'bg-sage-soft/90' 
                            : hasValue 
                              ? 'bg-ocean-soft' 
                              : 'bg-sage-pale/30';

                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full relative h-[44px] flex items-end justify-center">
                              <div
                                style={{ height: `${barHeight}px` }}
                                className={`w-full max-w-[14px] rounded-t-md transition-all duration-500 ${barColor}`}
                                title={hasValue ? `Avg score: ${d.value}` : 'No logs'}
                              />
                            </div>
                            <span className={`text-[9px] font-extrabold ${d.isToday ? 'text-sage font-black' : 'text-earth-muted'}`}>
                              {d.key}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </motion.div>
              );
            })()}

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
      <nav className="fixed bottom-4 left-4 right-4 md:left-auto md:right-auto md:w-full md:max-w-md mx-auto bg-white/95 backdrop-blur-lg border border-sage-soft/40 p-2 rounded-2xl flex justify-between items-center shadow-md z-40">
        <button
          id="nav-btn-home"
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'home' 
              ? 'bg-sage text-white shadow-xs' 
              : 'text-earth-muted hover:bg-sage-pale/40'
          }`}
        >
          <span className="text-base leading-none mb-0.5">🌱</span>
          <span className="font-sans text-[9px] uppercase tracking-wider font-extrabold">Home desk</span>
        </button>

        <button
          id="nav-btn-chat"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'chat' 
              ? 'bg-sage text-white shadow-xs' 
              : 'text-earth-muted hover:bg-sage-pale/40'
          }`}
        >
          <MessageCircle className="w-4.5 h-4.5 mb-1" />
          <span className="font-sans text-[9px] uppercase tracking-wider font-extrabold">Talk Willow</span>
        </button>

        <button
          id="nav-btn-body"
          onClick={() => setActiveTab('body')}
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'body' 
              ? 'bg-sage text-white shadow-xs' 
              : 'text-earth-muted hover:bg-sage-pale/40'
          }`}
        >
          <Heart className="w-4.5 h-4.5 mb-1" />
          <span className="font-sans text-[9px] uppercase tracking-wider font-extrabold">Somatic Peace</span>
        </button>

        <button
          id="nav-btn-journal"
          onClick={() => setActiveTab('journal')}
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'journal' 
              ? 'bg-sage text-white shadow-xs' 
              : 'text-earth-muted hover:bg-sage-pale/40'
          }`}
        >
          <BookOpen className="w-4.5 h-4.5 mb-1" />
          <span className="font-sans text-[9px] uppercase tracking-wider font-extrabold">My Journals</span>
        </button>
      </nav>

    </div>
  );
}
