import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Menu, ArrowUp, Plus, BrainCircuit, Bird, AlertTriangle } from 'lucide-react';
import { Message, Memory } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  newMemoriesAlert: Memory[];
  onSendMessage: (text: string) => Promise<void>;
  onNavigate: (tab: 'home' | 'chat' | 'body' | 'journal') => void;
  onReset: () => void;
}



export default function ChatInterface({ 
  messages, 
  newMemoriesAlert, 
  onSendMessage, 
  onNavigate, 
  onReset 
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [latestRemembered, setLatestRemembered] = useState<Memory | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages list grows
  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isSending]);

  // Hook new memories alert and display a floating notification toast
  useEffect(() => {
    if (newMemoriesAlert && newMemoriesAlert.length > 0) {
      setLatestRemembered(newMemoriesAlert[newMemoriesAlert.length - 1]);
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [newMemoriesAlert]);

  const handleSend = async (text: string) => {
    if (!text || text.trim() === '' || isSending) return;
    const finalTxt = text.trim();
    setInputText('');
    setIsSending(true);

    try {
      await onSendMessage(finalTxt);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  // Safe natural markdown interpreter
  const parseResponseContent = (content: string) => {
    const paragraphs = content.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      const parts = para.split(/(\*\*.*?\*\*)/);
      const formattedParts = parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-bold text-earth-dark underline decoration-apricot/60 decoration-2">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <p key={pIdx} className="leading-relaxed text-[13.5px] sm:text-sm text-earth-dark mb-2 font-sans font-semibold last:mb-0">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div id="chat-interface-wrapper" className="flex flex-col bg-white/25 sm:bg-white/35 backdrop-blur-md border-0 sm:border border-white/45 sm:rounded-[32px] flex-1 h-full min-h-0 relative overflow-hidden shadow-xs">
      
      {/* Floating Memory Synthesized Toast */}
      <AnimatePresence>
        {showNotification && latestRemembered && (
          <motion.div
            id="memory-extracted-toast"
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-18 left-4 right-4 z-40 bg-earth-dark/95 text-white rounded-2xl p-3.5 shadow-md flex items-start gap-3 border border-white/20"
          >
            <BrainCircuit className="w-5 h-5 text-sage shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 min-w-0">
              <h5 className="font-sans text-xs font-bold text-white/95 leading-none mb-1">
                Sana updated her journal card
              </h5>
              <p className="font-sans text-[11px] text-white/75 italic truncate">
                "Remembered: {latestRemembered.description}"
              </p>
            </div>
            <button 
              id="close-memory-toast"
              onClick={() => setShowNotification(false)}
              className="text-[10px] text-sage hover:text-white underline font-semibold font-sans px-1"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Sana style top header */}
      <div className="p-4 bg-white/35 backdrop-blur-sm flex items-center justify-between border-b border-white/40 sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Thin vertical line left of arrow back key */}
          <div className="h-6 w-[1.2px] bg-white/50 mr-1.5" />

          {/* Back key to return */}
          <button
            id="chat-back-btn"
            onClick={() => onNavigate('home')}
            className="p-1 px-1.5 text-earth-dark/80 hover:text-earth-dark transition-colors cursor-pointer"
            title="Go back to Home desk"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[1.8]" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>

          {/* Lunar Terracotta Avatar circle */}
          <div 
            onClick={() => onNavigate('home')}
            className="w-11 h-11 rounded-full bg-apricot hover:scale-105 transition-transform flex items-center justify-center text-xl cursor-pointer shrink-0 ml-1.5"
          >
            🌙
          </div>

          <div className="ml-2.5">
            <h4 className="font-serif text-lg font-bold text-earth-dark leading-none mb-1">
              Sana
            </h4>
            <span className="flex items-center gap-1.5 text-[11px] font-sans font-medium text-earth-muted">
              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isSending ? 'bg-amber-500 animate-pulse' : 'bg-sage-dark'}`} />
              {isSending ? 'typing...' : 'here with you'}
            </span>
          </div>
        </div>

        {/* Hamburger Styled Menu Button */}
        <div className="relative">
          <button
            id="chat-hamburger-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-earth-dark/80 hover:text-earth-dark hover:bg-white/40 rounded-full transition-colors cursor-pointer"
            title="Open navigation menu"
          >
            <Menu className="w-6 h-6 stroke-[1.5]" />
          </button>

          {/* Nav Dropdown Overlay popover */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setIsMenuOpen(false)} 
                />
                
                <motion.div
                  id="hamburger-nav-popover"
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  className="absolute right-0 mt-2 w-48 bg-white/95 border border-white/60 rounded-2xl shadow-md py-2 z-50 overflow-hidden font-sans text-xs font-bold text-earth-dark"
                >
                  <button
                    onClick={() => { onNavigate('home'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-sage/10 hover:text-earth-dark flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>🌱</span> Home Desk
                  </button>
                  <button
                    onClick={() => { onNavigate('body'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-sage/10 hover:text-earth-dark flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>🌬️</span> Somatic Peace
                  </button>
                  <button
                    onClick={() => { onNavigate('journal'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-sage/10 hover:text-earth-dark flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>📖</span> My Journals
                  </button>
                  <div className="border-t border-earth-muted/10 my-1" />
                  <button
                    onClick={() => { onReset(); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-rose-50/50 text-rose-800 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>🔄</span> Reset Sana
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages Feed */}
      <div
        id="messages-scroll-area"
        ref={containerRef}
        className="flex-1 overflow-y-auto p-5 space-y-6 bg-transparent overflow-x-hidden"
      >
        {messages.length === 0 ? (
          /* Exactly matching Sana initial greetings empty state from mockup */
          <div id="first-chat-intro" className="flex flex-col text-left py-2 space-y-4 max-w-[85%] mr-auto">
            <div className="p-4 sm:p-5 rounded-[20px] bg-white/70 text-earth-dark border border-white/60 shadow-xs rounded-tl-none">
              <p className="font-sans text-sm font-semibold leading-relaxed">
                Hey — good to see you. How are you feeling right now?
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, msgIdx) => {
            const isModel = msg.role === 'model';
            return (
              <div
                id={`chat-msg-${msg.id}`}
                key={msg.id}
                className="space-y-1"
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div
                    className={`p-3.5 sm:p-4 rounded-[20px] text-left transition-all shadow-[0px_1px_2px_rgba(0,0,0,0.02)] ${
                      isModel
                        ? 'bg-white/70 text-earth-dark border border-white/60 rounded-tl-sm'
                        : 'bg-sage text-white border border-white/20 rounded-tr-sm shadow-xs'
                    }`}
                  >
                    {isModel ? (
                      parseResponseContent(msg.content)
                    ) : (
                      <p className="font-sans text-[13.5px] sm:text-sm font-semibold whitespace-pre-wrap leading-relaxed text-white">
                        {msg.content}
                      </p>
                    )}
                    <span className={`text-[8.5px] block mt-1.5 font-mono text-right font-medium ${isModel ? 'text-earth-dark/45' : 'text-white/70'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Slow Thinking Indicators */}
        {isSending && (
          <div id="thinking-bubble" className="space-y-1">
            <div className="flex gap-3 max-w-[80%] mr-auto items-end">
              <div className="bg-white/70 text-earth-dark border border-white/60 p-4 rounded-[20px] rounded-tl-sm flex items-center justify-center gap-1.5 h-11 px-5 shadow-[0px_1px_2px_rgba(0,0,0,0.02)]">
                <span className="w-1.5 h-1.5 bg-sage/80 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-sage/80 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-sage/80 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Input Box - Capsule Pill with inner helper buttons */}
      <div className="p-4 bg-white/20 border-t border-white/35 flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex-1 bg-white/70 border border-white/65 focus-within:border-sage rounded-full py-1.5 px-4 flex items-center gap-2 shadow-2xs">
          {/* plus sign */}
          <button 
            type="button" 
            className="text-earth-muted hover:text-earth-dark transition-colors cursor-pointer shrink-0 px-1"
            onClick={() => setInputText("Can you help me breathe right now?")}
            title="Mindful breathe help"
          >
            <Plus className="w-5.5 h-5.5 stroke-[1.8]" />
          </button>
          
          <input
            id="chat-text-input"
            type="text"
            placeholder="Message Sana..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend(inputText);
              }
            }}
            disabled={isSending}
            className="flex-1 bg-transparent border-none text-xs sm:text-sm outline-none font-sans text-earth-dark placeholder-earth-muted/50 h-[40px] focus:ring-0 focus:outline-none"
          />

          <button
            id="send-chat-message-btn"
            onClick={() => handleSend(inputText)}
            disabled={!inputText.trim() || isSending}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-sage hover:bg-sage-dark hover:scale-[1.03] text-white transition-all disabled:opacity-40 shrink-0 cursor-pointer active:scale-[0.97]"
          >
            <ArrowUp className="w-5.5 h-5.5 text-white stroke-[2.5]" />
          </button>
        </div>
      </div>

    </div>
  );
}
