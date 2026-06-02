import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Heart, ShieldCheck, HelpCircle, Brain, EyeOff } from 'lucide-react';
import { Memory, MemoryCategory } from '../types';

interface MemoryConsoleProps {
  memories: Memory[];
  onDeleteMemory: (id: string) => Promise<void>;
}

const CATEGORY_MAP: Record<MemoryCategory, { label: string; bg: string; text: string; border: string; emoji: string }> = {
  trigger: {
    label: 'My Stressors & Triggers',
    bg: 'bg-warm',
    text: 'text-earth-dark',
    border: 'border-sage-soft',
    emoji: '⚠️'
  },
  helpful_strategy: {
    label: 'What Softens My Fear',
    bg: 'bg-sage-pale',
    text: 'text-sage-dark',
    border: 'border-sage-soft/40',
    emoji: '🌿'
  },
  unhelpful_strategy: {
    label: 'What Does Not Help',
    bg: 'bg-cream/40',
    text: 'text-earth-muted',
    border: 'border-sage-soft/30',
    emoji: '🛑'
  },
  context: {
    label: 'Life Context & Key People',
    bg: 'bg-ocean-soft/10',
    text: 'text-ocean-dark',
    border: 'border-ocean-soft/30',
    emoji: '🏡'
  },
  preference: {
    label: 'Willow Style Preferences',
    bg: 'bg-sage-soft/20',
    text: 'text-sage-dark',
    border: 'border-sage-soft/30',
    emoji: '💬'
  }
};

export default function MemoryConsole({ memories, onDeleteMemory }: MemoryConsoleProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteClick = async (id: string) => {
    setDeleteId(id);
    try {
      await onDeleteMemory(id);
    } catch (e) {
      console.error("Could not delete memory node:", e);
    } finally {
      setDeleteId(null);
    }
  };

  const groupMemories = () => {
    const groups: Record<MemoryCategory, Memory[]> = {
      trigger: [],
      helpful_strategy: [],
      unhelpful_strategy: [],
      context: [],
      preference: []
    };

    memories.forEach(mem => {
      if (groups[mem.category]) {
        groups[mem.category].push(mem);
      }
    });

    return groups;
  };

  const grouped = groupMemories();

  return (
    <div id="memory-console" className="bg-warm border border-sage-soft rounded-3xl p-6 relative overflow-hidden space-y-6 animate-none">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sage-soft/15 rounded-full blur-2xl -mr-10 -mt-10" />
      
      <div>
        <h3 className="font-sans font-medium text-earth-dark tracking-tight text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-sage-dark animate-pulse" />
          Willow's Personal Journals
        </h3>
        <p className="font-sans text-xs text-earth-muted mt-0.5">
          Unlike static clinical utilities, Willow listens and retains memories about you to support you organically with continuous recall.
        </p>
      </div>

      {/* Trust & Transparency Consent Banner */}
      <div id="memory-concept-notice" className="p-3.5 bg-sage-pale border border-sage-soft/30 rounded-2xl flex gap-3 text-xs text-earth-dark font-sans leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-sage shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-earth-dark">Sovereign Data Storage:</span> You hold full control over your background memories. If Willow records something inaccurate, or if a trigger changes, click the trash icon below to erase it instantly.
        </div>
      </div>

      <div className="space-y-4">
        {memories.length === 0 ? (
          <div id="no-memories-empty" className="h-40 flex flex-col items-center justify-center border border-dashed border-sage-soft rounded-2xl bg-white/40">
            <Heart className="w-5 h-5 text-sage-dark opacity-40 mb-1.5 animate-bounce" />
            <span className="font-sans text-xs text-earth-muted text-center px-4 leading-relaxed">
              Willow has not recorded any details yet.<br/>
              <span className="text-[11px] text-sage-dark font-medium">As you chat naturally about what upsets you, what calms you down, or who resides in your life, Willow will remember details!</span>
            </span>
          </div>
        ) : (
          (Object.keys(grouped) as MemoryCategory[]).map((cat) => {
            const list = grouped[cat];
            if (list.length === 0) return null;
            const config = CATEGORY_MAP[cat];

            return (
              <div id={`memory-group-${cat}`} key={cat} className="space-y-1.5">
                <h4 className="font-sans font-semibold text-xs text-sage-dark uppercase tracking-wider flex items-center gap-1.5 px-1">
                  <span>{config.emoji}</span>
                  {config.label} ({list.length})
                </h4>
                
                <div className="grid grid-cols-1 gap-1.5">
                  <AnimatePresence mode="popLayout">
                    {list.map((mem) => (
                      <motion.div
                        id={`memory-card-${mem.id}`}
                        key={mem.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-3 rounded-xl border ${config.bg} ${config.border} flex items-center justify-between gap-3 shadow-xs`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`font-sans text-xs font-semibold ${config.text} leading-tight`}>
                            {mem.description}
                          </p>
                          <span className="text-[9px] text-earth-muted font-mono block mt-1">
                            Updated {new Date(mem.lastUpdated).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </span>
                        </div>
                        
                        <button
                          id={`delete-memory-btn-${mem.id}`}
                          onClick={() => handleDeleteClick(mem.id)}
                          disabled={deleteId === mem.id}
                          className="p-1 px-2.5 rounded-lg text-rose-800 hover:text-rose-950 hover:bg-rose-50/50 bg-transparent transition-all border border-transparent disabled:opacity-45 cursor-pointer"
                          title="Erase memory node"
                        >
                          {deleteId === mem.id ? (
                            <span className="w-3.5 h-3.5 block border-2 border-rose-800 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
