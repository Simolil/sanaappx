import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, BrainCircuit, Activity, Bird, Smile } from 'lucide-react';
import { Message, Memory } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  newMemoriesAlert: Memory[];
  onSendMessage: (text: string) => Promise<void>;
}

// Preset warm quick responses
const QUICK_PROMPTS = [
  'I am having panic right now',
  'I have bad work tension',
  'Can you help me breathe?',
  'Why do I feel chest tightness?'
];

export default function ChatInterface({ messages, newMemoriesAlert, onSendMessage }: ChatInterfaceProps) {
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [latestRemembered, setLatestRemembered] = useState<Memory | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

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
    
    // Reset focus & rows height
    if (textInputRef.current) {
      textInputRef.current.style.height = 'auto';
    }

    try {
      await onSendMessage(finalTxt);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputText);
    }
  };

  // Safe natural markdown interpreter
  const parseResponseContent = (content: string) => {
    // Basic paragraphs splitting
    const paragraphs = content.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      // Inline formatting (bold **)
      const parts = para.split(/(\*\*.*?\*\*)/);
      const formattedParts = parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-extrabold text-[#4a3f35]">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <p key={pIdx} className="leading-relaxed text-xs sm:text-sm text-[#4a3f35] mb-2 font-sans font-medium last:mb-0">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div id="chat-interface-wrapper" className="flex flex-col bg-[#fcfaf5] border border-[#e6dfd5] rounded-3xl h-[480px] sm:h-[540px] relative overflow-hidden">
      
      {/* Floating Memory Synthesized Toast */}
      <AnimatePresence>
        {showNotification && latestRemembered && (
          <motion.div
            id="memory-extracted-toast"
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-4 left-4 right-4 z-40 bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-2xl p-3.5 shadow-lg flex items-start gap-3"
          >
            <BrainCircuit className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 min-w-0">
              <h5 className="font-sans text-xs font-bold text-white leading-none mb-1">
                Willow updated her journal card
              </h5>
              <p className="font-sans text-[11px] text-zinc-300 italic truncate">
                "Remembered: {latestRemembered.description}"
              </p>
            </div>
            <button 
              id="close-memory-toast"
              onClick={() => setShowNotification(false)}
              className="text-[10px] text-zinc-400 hover:text-white underline font-semibold font-sans px-1"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary chat head */}
      <div className="p-4 border-b border-[#f0eae1] bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-200 to-orange-100 flex items-center justify-center border border-amber-300 text-[#8c6239] shadow-sm font-semibold">
            W
          </div>
          <div>
            <h4 className="font-sans text-sm font-bold text-[#4a3f35] leading-none mb-1">
              Willow
            </h4>
            <span className="flex items-center gap-1.5 text-[10px] font-sans font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Mindful Companion • Active Memory
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-[#faf6f0] border border-[#f0eae1] p-1 px-2.5 rounded-xl text-xs text-amber-800 font-sans font-medium">
          <Smile className="w-3.5 h-3.5" /> Supporting you
        </div>
      </div>

      {/* Messages Feed */}
      <div
        id="messages-scroll-area"
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf8f3]"
      >
        {messages.length === 0 ? (
          <div id="first-chat-intro" className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-sm mx-auto">
            <Bird className="w-12 h-12 text-[#8c6239] opacity-40 animate-bounce" />
            <h4 className="font-sans text-base font-semibold text-[#4a3f35]">Enter a companion environment</h4>
            <p className="font-sans text-xs text-[#ddcfbd] leading-relaxed">
              Tell me where you feel tension or describe something stressful. Each detail shared builds a shared memory to better support you over time.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isModel = msg.role === 'model';
            return (
              <div
                id={`chat-msg-${msg.id}`}
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {isModel && (
                  <div className="w-7 h-7 rounded-full bg-amber-100/80 border border-amber-200 text-amber-950 font-bold text-xs flex items-center justify-center shrink-0 self-end mb-1">
                    W
                  </div>
                )}
                
                <div
                  className={`p-3.5 rounded-2xl border text-left shadow-none transition-all ${
                    isModel
                      ? 'bg-white border-[#f0eae1] rounded-bl-none text-[#4a3f35]'
                      : 'bg-[#8c6239] border-transparent text-[#fdfbf7] rounded-br-none'
                  }`}
                >
                  {isModel ? (
                    parseResponseContent(msg.content)
                  ) : (
                    <p className="font-sans text-xs sm:text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  )}
                  <span className={`text-[8px] block mt-1.5 font-mono text-right opacity-60 ${isModel ? 'text-[#8c6239]' : 'text-amber-100'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Slow Thinking Indicators */}
        {isSending && (
          <div id="thinking-bubble" className="flex gap-3 max-w-[80%] mr-auto items-end">
            <div className="w-7 h-7 rounded-full bg-amber-100/80 border border-amber-200 text-amber-950 font-bold text-xs flex items-center justify-center shrink-0">
              W
            </div>
            <div className="bg-white border border-[#f0eae1] p-3 rounded-2xl rounded-bl-none flex items-center gap-1 h-8 px-4">
              <span className="w-1.5 h-1.5 bg-[#8c6239] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-[#8c6239] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-[#8c6239] rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Suggested Input Quick Prompts */}
      {messages.length < 5 && (
        <div id="quick-prompts-container" className="px-3.5 py-1.5 bg-[#f5f1e9] border-t border-b border-[#e1d5c5]/40 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              id={`quick-prompt-${prompt.replace(/\s+/g, '-')}`}
              key={prompt}
              disabled={isSending}
              onClick={() => handleSend(prompt)}
              className="text-[10px] font-sans font-bold text-[#8c6239] bg-white border border-[#e6dfd5] px-2.5 py-1.5 rounded-full hover:bg-[#faf6f0] shrink-0 transition-all cursor-pointer shadow-sm disabled:opacity-45"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Form Input Box */}
      <div className="p-3 bg-white border-t border-[#f0eae1] flex gap-2">
        <textarea
          id="chat-text-input"
          ref={textInputRef}
          rows={1}
          placeholder="Safe notes, panic alerts, or anything causing worry..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          className="flex-1 bg-[#faf8f3] border border-[#e6dfd5] rounded-xl text-xs py-2 px-3 focus:outline-none focus:border-[#8c6239] resize-none h-[38px] max-h-16 font-sans font-medium text-[#4a3f35] placeholder-[#c3b6a5]"
        />
        <button
          id="send-chat-message-btn"
          onClick={() => handleSend(inputText)}
          disabled={!inputText.trim() || isSending}
          className="w-[38px] h-[38px] rounded-xl flex items-center justify-center bg-[#8c6239] text-white hover:bg-[#724f2d] transition-all shrink-0 disabled:opacity-45"
        >
          <Send className="w-4 h-4 text-amber-50" />
        </button>
      </div>

    </div>
  );
}
