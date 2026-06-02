import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Sparkles, AlertCircle, Plus, Calendar } from 'lucide-react';
import { MoodEntry } from '../types';

interface MoodHistoryProps {
  moodHistory: MoodEntry[];
  onAddMood: (score: number, notes: string, triggers: string[]) => Promise<void>;
}

const MOODS_DEFN = [
  { score: 1, label: '😣 High Anxiety', color: 'bg-rose-50 border-rose-200 text-rose-900' },
  { score: 2, label: '😟 Tense / Unsettled', color: 'bg-orange-50 border-orange-200 text-orange-900' },
  { score: 3, label: '😐 Static / Distant', color: 'bg-amber-50 border-amber-200 text-amber-900' },
  { score: 4, label: '🙂 Steady / Peaceful', color: 'bg-blue-50 border-blue-200 text-blue-900' },
  { score: 5, label: '🌸 Warm / Radiant', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' }
];

const PRESET_TRIGGERS = [
  'Work stress', 'Poor sleep', 'Social settings', 'Doubt / Overthinking', 'Loud noise', 'Fatigue', 'Deadlines', 'Health worry'
];

export default function MoodHistory({ moodHistory, onAddMood }: MoodHistoryProps) {
  const [selectedScore, setSelectedScore] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [customTrigger, setCustomTrigger] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleTrigger = (trig: string) => {
    setSelectedTriggers(prev => 
      prev.includes(trig) ? prev.filter(t => t !== trig) : [...prev, trig]
    );
  };

  const handleAddCustomTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTrigger.trim() !== '') {
      const formatted = customTrigger.trim();
      if (!selectedTriggers.includes(formatted)) {
        setSelectedTriggers(prev => [...prev, formatted]);
      }
      setCustomTrigger('');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onAddMood(selectedScore, notes, selectedTriggers);
      setNotes('');
      setSelectedTriggers([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build brief coordinates for custom SVG Trend Line chart (safe from complex packages/sizing errors)
  const renderTrendSVG = () => {
    if (moodHistory.length === 0) {
      return (
        <div id="mood-empty-chart" className="h-28 flex flex-col items-center justify-center border border-dashed border-sage-soft/70 rounded-2xl bg-white/40">
          <AlertCircle className="w-5 h-5 text-sage-dark opacity-40 mb-1 animate-pulse" />
          <span className="font-sans text-xs text-earth-muted italic">Check in your mood below to display trendlines</span>
        </div>
      );
    }

    const maxItems = 7;
    const recentScores = moodHistory.slice(-maxItems);
    const height = 120;
    const width = 340;
    const paddingX = 30;
    const paddingY = 20;

    // Map scores to coordinates
    const points = recentScores.map((item, idx) => {
      const x = paddingX + (idx / Math.max(1, recentScores.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - ((item.score - 1) / 4) * (height - 2 * paddingY);
      return { x, y };
    });

    const pathData = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    return (
      <div id="mood-trend-chart" className="bg-warm p-4 rounded-2xl border border-sage-soft relative shadow-sm animate-none">
        <div className="flex justify-between items-center mb-2.5">
          <span className="font-sans text-xs text-sage-dark font-black uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-sage" />
            Anxiety & Mood Trend ({recentScores.length} sessions)
          </span>
          <span className="font-mono text-[10px] text-earth-muted">
            Past readings
          </span>
        </div>
        
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
          {/* Guide Gridlines */}
          {[1, 3, 5].map((level, idx) => {
            const y = height - paddingY - ((level - 1) / 4) * (height - 2 * paddingY);
            return (
              <g key={level}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(90, 143, 120, 0.18)" strokeWidth="1" strokeDasharray="3 3" />
                <text x="5" y={y + 3} className="font-sans text-[8px] fill-sage-dark font-black">{level === 5 ? 'Peace' : level === 3 ? 'Static' : 'Anxious'}</text>
              </g>
            );
          })}

          {/* Connection Line */}
          {points.length > 1 && (
            <path d={pathData} fill="none" stroke="#5A8F78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Points circles with Tooltip style score numbering */}
          {points.map((pt, idx) => {
            const score = recentScores[idx].score;
            return (
              <g key={idx}>
                <circle cx={pt.x} cy={pt.y} r="5" fill="white" stroke="#5A8F78" strokeWidth="2.5" />
                <circle cx={pt.x} cy={pt.y} r="2" fill="#3E7260" />
                <text x={pt.x} y={pt.y - 8} textAnchor="middle" className="font-mono text-[9px] fill-earth-dark font-semibold">{score}</text>
                <text x={pt.x} y={height - 4} textAnchor="middle" className="font-sans text-[7px] fill-earth-muted">
                  {new Date(recentScores[idx].timestamp).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div id="mood-tracker" className="bg-warm border border-sage-soft rounded-3xl p-6 relative overflow-hidden space-y-6 animate-none">
      
      {/* Chart visualization */}
      {renderTrendSVG()}

      <div className="border-t border-sage-soft/30 pt-4">
        <h4 className="font-sans font-medium text-earth-dark text-base mb-3 flex items-center gap-1.5">
          <Calendar className="w-4.5 h-4.5 text-sage-dark" />
          Record Your Heartcheck
        </h4>
        
        {/* Mood scores horizontal list picker */}
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {MOODS_DEFN.map((def) => {
            const isSelected = selectedScore === def.score;
            return (
              <button
                id={`mood-score-${def.score}`}
                key={def.score}
                onClick={() => setSelectedScore(def.score)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
                  isSelected 
                    ? 'bg-sage border-transparent text-white shadow-sm scale-102 font-bold' 
                    : `${def.color.split(' ')[0]} ${def.color.split(' ')[1]} hover:bg-white/50 text-earth-muted`
                }`}
              >
                <span className="text-xl">{def.label.split(' ')[0]}</span>
                <span className="font-mono text-[10px] font-bold mt-1 max-sm:hidden">{def.score}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Label Display */}
        <div className="text-center font-sans font-semibold text-xs text-sage-dark mb-4 bg-white/50 py-1.5 px-3 rounded-xl border border-sage-soft/40">
          Current state: {MOODS_DEFN.find(d => d.score === selectedScore)?.label.substring(3)}
        </div>

        {/* Triggers list selector chips */}
        <div className="space-y-2">
          <label className="font-sans text-xs text-earth-muted font-medium">Identify any active stressors or triggers:</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TRIGGERS.map((trig) => {
              const isSelected = selectedTriggers.includes(trig);
              return (
                <button
                  id={`preset-btn-${trig.replace(/\s+/g, '-')}`}
                  key={trig}
                  type="button"
                  onClick={() => toggleTrigger(trig)}
                  className={`text-xs font-sans py-1 px-2.5 rounded-full border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-sage-soft text-sage-dark border-sage/40 font-bold' 
                      : 'bg-white/60 text-earth-muted border-sage-soft hover:bg-sage-pale'
                  }`}
                >
                  {trig}
                </button>
              );
            })}
          </div>

          {/* Add custom trigger inline form */}
          <form onSubmit={handleAddCustomTrigger} className="flex gap-2">
            <input
              id="custom-trigger-input"
              type="text"
              placeholder="Add other stressor..."
              value={customTrigger}
              onChange={(e) => setCustomTrigger(e.target.value)}
              className="bg-white border border-sage-soft/60 rounded-xl text-xs py-1.5 px-3 flex-1 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-soft/40"
            />
            <button
              id="add-custom-trigger-btn"
              type="submit"
              className="p-1 px-3 bg-cream hover:bg-sage-pale text-xs font-sans font-medium text-earth-dark rounded-xl border border-sage-soft/40 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Track
            </button>
          </form>
        </div>

        {/* Notes Input */}
        <div className="space-y-1.5 mt-4">
          <label className="font-sans text-xs text-earth-muted font-medium">Notes & reflections (Willow will read these for context!):</label>
          <textarea
            id="mood-notes-textarea"
            placeholder="Write words about your feelings, physical sensations or situations causing stress..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white border border-sage-soft/80 rounded-xl text-xs p-3 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-soft/40 text-earth-dark font-medium"
          />
        </div>

        {/* Submit */}
        <button
          id="submit-mood-btn"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-sage hover:bg-sage-dark text-white text-xs font-sans font-bold py-3.5 rounded-xl mt-4 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-4.5 h-4.5 fill-current" />
          {isSubmitting ? 'Recording & Synthesizing...' : 'Log Heartcheck & Inform Willow'}
        </button>
      </div>
    </div>
  );
}
