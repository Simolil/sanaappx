import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Heart, BookOpen, RotateCcw, AlertTriangle, ArrowRight, Brain, Sparkles, Sliders } from 'lucide-react';
import { CompanionState, Message, Memory, MoodEntry, MemoryCategory } from './types';

// Importing Custom Sub-components
import ChatInterface from './components/ChatInterface';
import BreathingExercise from './components/BreathingExercise';
import SynthSoundscape from './components/SynthSoundscape';
import MoodHistory from './components/MoodHistory';
import MemoryConsole from './components/MemoryConsole';

import { CustomEmoji } from './components/CustomEmojis';

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

// Personal Smart Simulator for Offline/Static environments like GitHub Pages
function getLocalSanaResponse(userMessageText: string, name: string, memories: Memory[], moodHistory: MoodEntry[]): { reply: string, newMemories: Memory[] } {
  const text = userMessageText.toLowerCase().trim();
  let reply = "";
  let newMemories: Memory[] = [];

  // Analyze triggers and context
  const hasPanic = text.includes("panic") || text.includes("can't breathe") || text.includes("scared");
  const hasWork = text.includes("work") || text.includes("job") || text.includes("boss") || text.includes("career");
  const hasSleep = text.includes("sleep") || text.includes("night") || text.includes("tired");
  const hasSocial = text.includes("people") || text.includes("social") || text.includes("crowd") || text.includes("friend");

  if (hasPanic) {
    const exists = memories.some(m => m.description.includes("Panic"));
    if (!exists) {
      newMemories.push({
        id: 'mem_local_' + Math.random().toString(36).substring(2, 9),
        category: 'trigger',
        description: 'Sudden high anxiety or panic episodes',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
  }
  if (hasWork) {
    const exists = memories.some(m => m.description.includes("Work"));
    if (!exists) {
      newMemories.push({
        id: 'mem_local_' + Math.random().toString(36).substring(2, 9),
        category: 'trigger',
        description: 'Workplace pressures and professional performance',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
  }
  if (hasSleep) {
    const exists = memories.some(m => m.description.includes("sleep"));
    if (!exists) {
      newMemories.push({
        id: 'mem_local_' + Math.random().toString(36).substring(2, 9),
        category: 'trigger',
        description: 'Sleep disruptions and nighttime overthinking',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
  }
  if (hasSocial) {
    const exists = memories.some(m => m.description.includes("Social"));
    if (!exists) {
      newMemories.push({
        id: 'mem_local_' + Math.random().toString(36).substring(2, 9),
        category: 'trigger',
        description: 'Social situations and interpersonal worries',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
  }

  // Pick suitable response
  if (hasPanic) {
    reply = `Please drop your shoulders, ${name}. I'm right here beside you. You are in no immediate danger, and this feeling will pass. Let's practice a slow breath: breathe in with me... hold... and release. You are completely safe.`;
  } else if (text.includes("hello") || text.includes("hi ") || text.includes("hey") || text.includes("meet")) {
    reply = `Hello ${name}! It feels so calming to greet you here. This is our quiet space. How are you carrying yourself right now?`;
  } else if (text.includes("breathe") || text.includes("how to breathe")) {
    reply = `Let's take a slow breath together, ${name}. Try using the Somatic Peace tab below to access my rhythmic guide or ambient sounds. Breathing slowly is the quickest way to calm our nervous system.`;
  } else if (text.includes("sad") || text.includes("cry") || text.includes("depressed")) {
    reply = `I can feel how raw and heavy this is for you, ${name}. It is completely valid to feel sad or overwhelmed. You do not have to put on a strong face here. I am keeping you company.`;
  } else if (hasWork) {
    reply = `Your work is taking a huge toll on you, ${name}. It's understandable to feel squeezed by modern workloads. Let's give ourselves permission to put the worries down for just a moment. Your peace comes first.`;
  } else if (hasSleep) {
    reply = `Nighttime holds a mirror to our worries, making everything seem louder, ${name}. Let's turn off the demands. I'm right here holding watch, so you are allowed to rest your mind.`;
  } else {
    const genericPrompts = [
      `I'm listening closely, ${name}. Anxious thoughts can be so loud, but they are just waves passing over the surface. We can stay anchored here together.`,
      `Thank you for trusting me with this, ${name}. I am keeping this safely logged in our journals so we don't forget how strong you've been. What is one small step that would feel gentlest for you?`,
      `I can hear how much energy you're spending to stay afloat, ${name}. You are allowed to be tired. You are allowed to take a break. Let's just sit in quiet peace for a moment.`,
      `I hear you, ${name}. We can handle this one breath, one step, one moment at a time. Tell me more, or we can simply rest.`
    ];
    reply = genericPrompts[Math.floor(Math.random() * genericPrompts.length)];
  }

  return { reply, newMemories };
}

export default function App() {
  const [state, setState] = useState<CompanionState | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'body' | 'journal'>('home');
  const [onboardName, setOnboardName] = useState<string>('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [newMemoriesAlert, setNewMemoriesAlert] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bodySubTab, setBodySubTab] = useState<'breathing' | 'soundscapes'>('breathing');
  const [selectedSoundProfile, setSelectedSoundProfile] = useState<'drone' | 'waves' | 'fireplace'>('drone');
  const [isClientSide, setIsClientSide] = useState<boolean>(false);

  // Initialize a default client side state
  const initializeLocalState = () => {
    const defaultState: CompanionState = {
      profile: {
        name: '',
        onboardingCompleted: false,
        createdAt: new Date().toISOString()
      },
      messages: [],
      memories: [],
      moodHistory: []
    };
    setState(defaultState);
    localStorage.setItem('sana_local_state', JSON.stringify(defaultState));
  };

  const saveLocalState = (newState: CompanionState) => {
    setState(newState);
    localStorage.setItem('sana_local_state', JSON.stringify(newState));
  };

  // Load the backend state on initial mount
  const fetchState = async () => {
    try {
      setErrorText(null);
      const res = await fetch('/api/companion/state');
      if (!res.ok) throw new Error('Failed to retrieve companion state');
      const data = await res.json();
      setState(data);
      setIsClientSide(false);
    } catch (err: any) {
      console.warn("Sana Server unreachable, falling back to fully-featured browser storage mode:", err);
      setIsClientSide(true);
      
      const localData = localStorage.getItem('sana_local_state');
      if (localData) {
        try {
          setState(JSON.parse(localData));
        } catch {
          initializeLocalState();
        }
      } else {
        initializeLocalState();
      }
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

    if (isClientSide) {
      const name = onboardName.trim();
      const initialMessage: Message = {
        id: 'msg_init_' + Date.now(),
        role: 'model',
        content: `Hi ${name}, it's so comforting to meet you. I'm Sana. I'm right here beside you. Here, you don't have to carry your stress or anxieties on your own. Whatever you choose to tell me, I'll hold onto it so we can talk through things at your pace. How is your heart doing today?`,
        timestamp: new Date().toISOString()
      };
      const newState: CompanionState = {
        profile: {
          name,
          onboardingCompleted: true,
          createdAt: new Date().toISOString()
        },
        messages: [initialMessage],
        memories: [],
        moodHistory: []
      };
      saveLocalState(newState);
      return;
    }

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
  const handleSendMessage = async (text: string, isMoodTrigger = false, moodLabel = "") => {
    if (!state) return;

    if (isClientSide) {
      if (isMoodTrigger) {
        let replyText = "";
        const lowerLabel = moodLabel.toLowerCase();
        if (lowerLabel.includes("anxious") || lowerLabel.includes("panic")) {
          replyText = `hey... i saw you checked in feeling really anxious and overwhelmed. take a deep, slow breath with me. i'm right here beside you. you're safe.`;
        } else if (lowerLabel.includes("sad") || lowerLabel.includes("down") || lowerLabel.includes("depressed")) {
          replyText = `gently checking in on you. saw you're feeling down and heavy today. you don't have to carry it alone, i'm right here.`;
        } else if (lowerLabel.includes("angry") || lowerLabel.includes("irritated")) {
          replyText = `hey, saw you checked in feeling angry or irritated. it's completely okay to feel that way. i'm here if you want to vent or just sit in quiet.`;
        } else if (lowerLabel.includes("calm") || lowerLabel.includes("peace") || lowerLabel.includes("good")) {
          replyText = `i'm so glad you checked in feeling peaceful and grounded today. thank you for sharing that clarity with me.`;
        } else {
          replyText = `i saw you checked in feeling a bit ${lowerLabel} today. just wanted to say i'm right here with you.`;
        }

        setTimeout(() => {
          setState(prev => {
            if (!prev) return prev;
            const modelMsg: Message = {
              id: 'msg_m_' + Date.now(),
              role: 'model',
              content: replyText,
              timestamp: new Date().toISOString()
            };
            const finalState: CompanionState = {
              ...prev,
              messages: [...prev.messages, modelMsg]
            };
            localStorage.setItem('sana_local_state', JSON.stringify(finalState));
            return finalState;
          });
        }, 1000);
        return;
      }

      // Locally inject the user message instantly to feel highly responsive
      const localUserMsg: Message = {
        id: 'msg_local_' + Date.now(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...state.messages, localUserMsg];

      // 1. Instantly append user's message
      const stateWithUserMsg = {
        ...state,
        messages: updatedMessages
      };
      saveLocalState(stateWithUserMsg);

      // 2. Simulate Sana typing briefly with subtle timing
      setTimeout(() => {
        setState(prev => {
          if (!prev) return prev;
          const resolution = getLocalSanaResponse(
            text,
            prev.profile.name,
            prev.memories,
            prev.moodHistory
          );

          const modelMsg: Message = {
            id: 'msg_m_' + Date.now(),
            role: 'model',
            content: resolution.reply,
            timestamp: new Date().toISOString()
          };

          const finalState: CompanionState = {
            ...prev,
            messages: [...prev.messages, modelMsg],
            memories: [...prev.memories, ...resolution.newMemories]
          };

          if (resolution.newMemories.length > 0) {
            setNewMemoriesAlert(resolution.newMemories);
          }
          localStorage.setItem('sana_local_state', JSON.stringify(finalState));
          return finalState;
        });
      }, 1000);

      return;
    }

    if (!isMoodTrigger) {
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
    }

    try {
      const res = await fetch('/api/companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isMoodTrigger 
            ? { isMoodTrigger: true, moodLabel } 
            : { content: text }
        ),
      });
      if (!res.ok) throw new Error('Failed to transmit message to Sana');
      const data = await res.json();
      
      if (data.success) {
        // If background analysis successfully summarized details, pass them to alert channel
        if (data.newMemories && data.newMemories.length > 0) {
          setNewMemoriesAlert(data.newMemories);
        }
        setState(data.state);
      }
    } catch (err: any) {
      setErrorText('Sana is offline or busy. Let’s try again in a second.');
      // Revert the temporary user text if server transmission crashed
      fetchState();
    }
  };

  // Record a Mood Entry check-in
  const handleAddMood = async (score: number, notes: string, triggers: string[]) => {
    if (isClientSide && state) {
      const newEntry: MoodEntry = {
        id: 'mood_local_' + Date.now(),
        score,
        notes: notes || '',
        triggers: triggers || [],
        timestamp: new Date().toISOString()
      };
      
      // Auto-extract trigger details locally if notes exists
      let autoMemories: Memory[] = [];
      if (notes && notes.trim() !== '') {
        const text = notes.toLowerCase();
        let triggerDesc = "";
        let triggerCat: MemoryCategory = "trigger";

        if (text.includes("work") || text.includes("job") || text.includes("boss")) {
          triggerDesc = "Workplace performance notes";
        } else if (text.includes("family") || text.includes("people") || text.includes("interaction")) {
          triggerDesc = "Social interaction patterns";
        } else if (text.includes("sleep") || text.includes("night") || text.includes("tired")) {
          triggerDesc = "Irregular sleep patterns";
        } else if (text.includes("health")) {
          triggerDesc = "Physical health stressors";
        } else if (text.includes("breathe") || text.includes("walking") || text.includes("exercise")) {
          triggerDesc = "Going for a walk or deep breathing";
          triggerCat = "helpful_strategy";
        } else {
          triggerDesc = "Situational anxiety logs";
        }

        const exists = state.memories.some(m => m.description === triggerDesc);
        if (!exists) {
          autoMemories.push({
            id: 'mem_local_' + Math.random().toString(36).substring(2, 9),
            category: triggerCat,
            description: triggerDesc,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          });
        }
      }

      const finalState: CompanionState = {
        ...state,
        moodHistory: [...state.moodHistory, newEntry],
        memories: [...state.memories, ...autoMemories]
      };
      saveLocalState(finalState);
      return finalState;
    }

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

      await handleSendMessage("", true, label);
    } catch (e) {
      console.error(e);
    }
  };

  // Erase memory node (Consent and sovereignty)
  const handleDeleteMemory = async (id: string) => {
    if (isClientSide && state) {
      const remainingMemories = state.memories.filter(m => m.id !== id);
      const finalState = {
        ...state,
        memories: remainingMemories
      };
      saveLocalState(finalState);
      return;
    }

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
    
    if (isClientSide) {
      localStorage.removeItem('sana_local_state');
      initializeLocalState();
      setOnboardName('');
      setActiveTab('home');
      setNewMemoriesAlert([]);
      return;
    }

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
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-sage border-t-transparent rounded-full animate-spin" />
        <p className="font-sans text-xs text-sage-dark font-medium tracking-wide mt-4">Opening Sana’s Desk • Breathing deeply...</p>
      </div>
    );
  }

  // Onboarding Screen logic
  if (state && !state.profile.onboardingCompleted) {
    return (
      <div id="onboarding-container" className="min-h-screen bg-transparent text-earth-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-card w-full max-w-sm p-8 flex flex-col space-y-6"
        >
          {/* Introductory details */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-100 to-amber-200 border border-amber-300 mx-auto flex items-center justify-center text-amber-700 shadow-md animate-pulse">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            
            <h1 className="font-serif text-2xl font-bold tracking-tight text-earth-dark">
              Meet Sana
            </h1>
            <p className="font-sans text-xs text-earth-muted leading-relaxed">
              Unlike static meditation timers (Calm, Headspace) or rigid CBT screens (Wysa, Woebot), <strong className="font-semibold text-sage-dark">Sana is a memory-retaining companion</strong>. 
            </p>
            <p className="font-sans text-xs text-earth-muted/90 leading-relaxed bg-white/20 p-4 rounded-2xl border border-white/30">
              As you chat naturally, Sana automatically logs your triggers, preferences, and personal stressors, continuously incorporating them to build a deep, trusted conversational relationship. You have full command of what she remembers.
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
                className="w-full glass-input rounded-2xl py-3 px-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-sage/20 font-medium text-earth-dark"
              />
            </div>

            {errorText && (
              <div id="onboard-error-box" className="p-3.5 bg-rose-50/75 backdrop-blur-sm text-rose-950 font-medium font-sans text-xs rounded-2xl border border-rose-100 flex items-start gap-2">
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
              Step inside Sana
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </motion.div>
      </div>
    );
  }

  return (
    <div className={`bg-transparent text-earth-dark font-sans flex flex-col ${activeTab === 'chat' ? 'h-screen overflow-hidden' : 'min-h-screen pb-24'}`}>
      
      {/* Top Banner Bar */}
      {activeTab !== 'chat' && (
        <header className="bg-white/25 backdrop-blur-md border-b border-white/20 py-4 px-6 flex items-center justify-between sticky top-0 z-30 shadow-none">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌙</span>
            <h1 className="font-serif text-xl font-bold tracking-tight text-sage-dark flex items-center gap-1.5">
              sana
            </h1>
          </div>

          <button
            id="btn-app-reset"
            onClick={handleReset}
            className="text-[10px] font-sans font-bold text-earth-muted bg-cream border border-sage-soft/40 hover:bg-sage-pale p-1.5 px-3 rounded-xl flex items-center gap-1 transition-all cursor-pointer animate-none"
            title="Reset onboarding and delete memories database"
          >
            <RotateCcw className="w-3 h-3 text-sage-dark" /> Reset Sana
          </button>
        </header>
      )}

      {/* Main Single Screen Layout Context */}
      <main className={`flex-1 w-full max-w-md mx-auto ${
        activeTab === 'chat' 
          ? 'flex flex-col overflow-hidden p-0' 
          : 'p-4 md:py-6 space-y-6'
      }`}>
        
        {errorText && (
          <div id="app-error-banner" className="p-3 bg-rose-50 text-rose-950 font-sans text-xs rounded-2xl border border-rose-100 flex items-start gap-2 animate-bounce shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-700 shrink-0" />
            <div className="flex-1">
              <span>{errorText}</span>
              <button onClick={() => setErrorText(null)} className="underline ml-2 font-bold hover:text-rose-900">Dismiss</button>
            </div>
          </div>
        )}

        {/* Tab Swappers Panel Frame */}
        <div className={`relative ${activeTab === 'chat' ? 'flex-1 flex flex-col overflow-hidden' : ''}`}>
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
                  <div className="glass-card p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                    {/* Soft glowing ambient lighting layers in background */}
                    <div className="absolute right-0 top-0 w-36 h-36 bg-sage/20 rounded-full blur-2xl -mr-12 -mt-12" />
                    <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-sage-soft/20 rounded-full blur-xl" />
                    {/* Subtle warm sunny yellow glow circle/particle background detail */}
                    <div className="absolute right-12 bottom-6 w-11 h-11 bg-gradient-to-tr from-[#FFE699]/35 to-amber-300/40 rounded-full blur-xs animate-pulse" />
                    <div className="relative z-10">
                      <div className="text-2xl mb-2">{partEmoji}</div>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-earth-muted mb-1">
                        {partOfDay}
                      </div>
                      <h2 className="font-sans font-black text-2xl sm:text-3xl font-extrabold tracking-tight text-earth-dark leading-snug">
                        {rotatedQuote}
                      </h2>
                    </div>

                    <div className="mt-5 flex gap-2 relative z-10">
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="bg-sage hover:bg-sage-dark text-white font-sans font-bold text-xs px-4 py-2.5 rounded-full cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                      >
                        💬 Talk to Sana
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('body');
                          setBodySubTab('breathing');
                        }}
                        className="bg-white/40 hover:bg-white/60 border border-white/50 text-earth-dark font-sans font-medium text-xs px-3.5 py-2.5 rounded-full cursor-pointer transition-all"
                      >
                        🌬️ Breathe
                      </button>
                    </div>
                  </div>

                  {/* Immediate Heartcheck Grid Selector */}
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xs font-bold text-earth-dark flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                          How is your heart right now?
                        </span>
                        <p className="text-[10px] text-earth-muted mt-0.5 font-sans font-medium">Sana adapts to whatever you register.</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 border border-amber-200/50 px-2.5 py-0.5 rounded-xl flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Quick Check
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { val: 1, label: 'Angry', color: 'hover:bg-rose-500/10 hover:border-rose-300 border-white/45 bg-white/25 text-earth-dark' },
                        { val: 2, label: 'Worried', color: 'hover:bg-cyan-500/10 hover:border-cyan-300 border-white/45 bg-white/25 text-earth-dark' },
                        { val: 3, label: 'Neutral', color: 'hover:bg-blue-500/10 hover:border-blue-300 border-white/45 bg-white/25 text-earth-dark' },
                        { val: 4, label: 'Good', color: 'hover:bg-amber-400/20 hover:border-amber-300 border-white/45 bg-white/25 text-earth-dark ring-2 ring-amber-300/30' },
                        { val: 5, label: 'Calm', color: 'hover:bg-emerald-500/10 hover:border-emerald-300 border-white/45 bg-white/25 text-earth-dark' }
                      ].map(m => (
                        <button
                          key={m.val}
                          onClick={() => handleMoodSelectAndReassure(m.val, m.label)}
                          className={`flex flex-col items-center gap-1.5 p-2 border rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${m.color}`}
                        >
                          <CustomEmoji 
                            score={m.val} 
                            className="w-10 h-10 hover:rotate-3 transition-transform" 
                          />
                          <span className="text-[10px] font-bold text-earth-muted/90 tracking-tight">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dual-gradient "Sana remembers" Card */}
                  <div
                    onClick={() => setActiveTab('journal')}
                    className="group cursor-pointer relative overflow-hidden bg-gradient-to-br from-sage/35 to-apricot-soft/15 backdrop-blur-md border border-white/50 p-5 rounded-[26px] shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="absolute right-3 top-3 opacity-10">
                      <Brain className="w-14 h-14" />
                    </div>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#2C3A4E] bg-white/45 border border-white/40 px-2.5 py-0.5 rounded-md">
                        💭 Sana remembers
                      </span>
                    </div>
                    <p className="font-sans text-xs text-earth-dark/90 leading-relaxed font-medium italic">
                      {latestMemory
                        ? `"${latestMemory.description}"`
                        : '"We haven’t mapped any stressors yet. Let’s talk inside the chat tab, and I will safely record key stressors to support you."'}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-[9px] text-earth-muted font-bold tracking-widest uppercase">
                      <span>{listMemories.length} details logged securely</span>
                      <span className="group-hover:translate-x-1 transition-transform">Audit journal →</span>
                    </div>
                  </div>

                  {/* Ambient sound quick shortcut presets */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-earth-dark px-1">Comforting Sound Presets</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div 
                        onClick={() => {
                          setActiveTab('body');
                          setBodySubTab('soundscapes');
                          setSelectedSoundProfile('waves');
                        }}
                        className="cursor-pointer glass-card hover:bg-white/60 p-4 flex flex-col items-center gap-2 transition-all hover:scale-102"
                      >
                        <div className="w-9 h-9 rounded-full bg-white/65 flex items-center justify-center text-lg">🌊</div>
                        <span className="text-[11px] font-bold text-earth-dark text-center leading-tight">Ocean Waves</span>
                        <span className="text-[9px] text-earth-muted tracking-wide text-center">Steady tide</span>
                      </div>
                      
                      <div 
                        onClick={() => {
                          setActiveTab('body');
                          setBodySubTab('soundscapes');
                          setSelectedSoundProfile('fireplace');
                        }}
                        className="cursor-pointer glass-card hover:bg-white/60 p-4 flex flex-col items-center gap-2 transition-all hover:scale-102"
                      >
                        <div className="w-9 h-9 rounded-full bg-white/65 flex items-center justify-center text-lg">🔥</div>
                        <span className="text-[11px] font-bold text-earth-dark text-center leading-tight">Kindling Hearth</span>
                        <span className="text-[9px] text-earth-muted tracking-wide text-center">Cozy crackle</span>
                      </div>

                      <div 
                        onClick={() => {
                          setActiveTab('body');
                          setBodySubTab('soundscapes');
                          setSelectedSoundProfile('drone');
                        }}
                        className="cursor-pointer glass-card hover:bg-white/60 p-4 flex flex-col items-center gap-2 transition-all hover:scale-102"
                      >
                        <div className="w-9 h-9 rounded-full bg-white/65 flex items-center justify-center text-lg">🔮</div>
                        <span className="text-[11px] font-bold text-earth-dark text-center leading-tight">Cosmic Slate</span>
                        <span className="text-[9px] text-earth-muted tracking-wide text-center font-sans">Slow drone</span>
                      </div>
                    </div>
                  </div>

                  {/* Home Streak and Weekly Trend bars */}
                  <div className="glass-card p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🌱</span>
                        <span className="text-xs font-bold text-earth-dark">This week’s trend</span>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/50 text-amber-700/90 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-2xs">
                        ⭐ Streak: {chartMoodData.filter(d => d.value > 0).length} check-ins
                      </span>
                    </div>

                    <div className="flex gap-1.5 items-end justify-between h-14 md:h-16">
                      {chartMoodData.map((d, i) => {
                        const hasValue = d.value > 0;
                        const barHeight = hasValue ? Math.round((d.value / 5) * 44) + 6 : 4;
                        const barColor = d.isToday 
                          ? 'bg-sage' 
                          : d.value >= 4 
                            ? 'bg-sage/40' 
                            : hasValue 
                              ? 'bg-sage/30' 
                              : 'bg-white/10';

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
                className="flex-1 flex flex-col overflow-hidden"
              >
                <ChatInterface
                  messages={state.messages}
                  newMemoriesAlert={newMemoriesAlert}
                  onSendMessage={handleSendMessage}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onReset={handleReset}
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
                className="space-y-5"
              >
                {/* Beautiful Sub-tab controller */}
                <div id="somatic-tabs-selector" className="flex bg-white/20 border border-white/35 p-1 rounded-2xl w-full justify-center shadow-xs">
                  <button
                    id="sub-tab-breathing"
                    onClick={() => setBodySubTab('breathing')}
                    className={`flex-1 text-xs font-sans font-extrabold tracking-wide py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      bodySubTab === 'breathing' 
                        ? 'bg-sage text-white shadow-xs font-black' 
                        : 'text-earth-muted hover:bg-white/35'
                    }`}
                  >
                    <span>🌬️</span> Breathwork
                  </button>
                  <button
                    id="sub-tab-soundscapes"
                    onClick={() => setBodySubTab('soundscapes')}
                    className={`flex-1 text-xs font-sans font-extrabold tracking-wide py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      bodySubTab === 'soundscapes' 
                        ? 'bg-sage text-white shadow-xs font-black' 
                        : 'text-earth-muted hover:bg-white/35'
                    }`}
                  >
                    <span>🎵</span> Ambient Sounds
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {bodySubTab === 'breathing' ? (
                    <motion.div
                      key="breathing-content"
                      initial={{ opacity: 0, scale: 0.98, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BreathingExercise />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="soundscapes-content"
                      initial={{ opacity: 0, scale: 0.98, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SynthSoundscape initialProfile={selectedSoundProfile} />
                    </motion.div>
                  )}
                </AnimatePresence>
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
      {activeTab !== 'chat' && (
        <nav className="fixed bottom-4 left-4 right-4 md:left-auto md:right-auto md:w-full md:max-w-md mx-auto bg-white/35 backdrop-blur-xl border border-white/45 p-2 rounded-2xl flex justify-between items-center shadow-md z-40">
          <button
            id="nav-btn-home"
            onClick={() => setActiveTab('home')}
            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
              activeTab === 'home' 
                ? 'bg-sage text-white shadow-xs' 
                : 'text-earth-muted/80 hover:bg-white/30'
            }`}
          >
            <span className="text-base leading-none mb-0.5">🌱</span>
            <span className="font-sans text-[9px] uppercase tracking-wider font-extrabold">Home desk</span>
            {activeTab === 'home' && <span className="w-1 h-1 rounded-full bg-amber-300 mt-0.5 animate-pulse" />}
          </button>

          <button
            id="nav-btn-chat"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
              activeTab === 'chat' 
                ? 'bg-sage text-white shadow-xs' 
                : 'text-earth-muted/80 hover:bg-white/30'
            }`}
          >
            <MessageCircle className="w-4.5 h-4.5 mb-1" />
            <span className="font-sans text-[9px] uppercase tracking-wider font-extrabold">Talk Sana</span>
            {activeTab === 'chat' && <span className="w-1 h-1 rounded-full bg-amber-300 mt-0.5 animate-pulse" />}
          </button>

          <button
            id="nav-btn-body"
            onClick={() => setActiveTab('body')}
            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
              activeTab === 'body' 
                ? 'bg-sage text-white shadow-xs' 
                : 'text-earth-muted/80 hover:bg-white/30'
            }`}
          >
            <Heart className="w-4.5 h-4.5 mb-1" />
            <span className="font-sans text-[9px] uppercase tracking-wider font-extrabold">Somatic Peace</span>
            {activeTab === 'body' && <span className="w-1 h-1 rounded-full bg-amber-300 mt-0.5 animate-pulse" />}
          </button>

          <button
            id="nav-btn-journal"
            onClick={() => setActiveTab('journal')}
            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
              activeTab === 'journal' 
                ? 'bg-sage text-white shadow-xs' 
                : 'text-earth-muted/80 hover:bg-white/30'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5 mb-1" />
            <span className="font-sans text-[9px] uppercase tracking-wider font-extrabold">My Journals</span>
            {activeTab === 'journal' && <span className="w-1 h-1 rounded-full bg-amber-300 mt-0.5 animate-pulse" />}
          </button>
        </nav>
      )}

    </div>
  );
}
