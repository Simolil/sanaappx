import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Play, Pause, RotateCcw, Clock } from 'lucide-react';

type BreathingState = 'idle' | 'inhale' | 'hold_in' | 'exhale' | 'hold_out';

interface BreathingStep {
  state: BreathingState;
  text: string;
  duration: number; // in seconds
  scale: number; // scale rating for bubble
  color: string;
}

const BOX_STEPS: BreathingStep[] = [
  { state: 'inhale', text: 'Breathe in slowly...', duration: 4, scale: 1.6, color: 'bg-sage-soft text-sage-dark border-sage' },
  { state: 'hold_in', text: 'Suspend the breath...', duration: 4, scale: 1.6, color: 'bg-ocean-soft text-ocean-dark border-ocean' },
  { state: 'exhale', text: 'Breathe out softly...', duration: 4, scale: 1.0, color: 'bg-sage-pale text-sage-dark border-sage-soft' },
  { state: 'hold_out', text: 'Rest fully...', duration: 4, scale: 1.0, color: 'bg-ocean-pale text-ocean-dark border-ocean-soft' }
];

const G_STEPS: BreathingStep[] = [
  { state: 'inhale', text: 'Inhale through nose...', duration: 4, scale: 1.6, color: 'bg-sage-soft text-sage-dark border-sage' },
  { state: 'hold_in', text: 'Hold deep and center...', duration: 7, scale: 1.6, color: 'bg-ocean-soft text-ocean-dark border-ocean' },
  { state: 'exhale', text: 'Sigh out loud...', duration: 8, scale: 1.0, color: 'bg-sage-pale text-sage-dark border-sage-soft' }
];

export default function BreathingExercise() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [pattern, setPattern] = useState<'box' | '478'>('box');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(4);
  const [totalCompleted, setTotalCompleted] = useState<number>(0);

  const timerRef = useRef<any>(null);

  const steps = pattern === 'box' ? BOX_STEPS : G_STEPS;
  const currentStep = steps[stepIndex];

  useEffect(() => {
    if (isActive) {
      setTimeLeft(steps[stepIndex].duration);
    }
  }, [stepIndex, pattern, isActive]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Progress step
          setStepIndex((idx) => {
            const nextIdx = (idx + 1) % steps.length;
            if (nextIdx === 0) {
              setTotalCompleted((cycles) => cycles + 1);
            }
            return nextIdx;
          });
          return steps[(stepIndex + 1) % steps.length].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, stepIndex, steps]);

  const handleToggle = () => {
    setIsActive(!isActive);
    if (!isActive) {
      setStepIndex(0);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setStepIndex(0);
    setTimeLeft(steps[0].duration);
    setTotalCompleted(0);
  };

  const handlePatternChange = (pt: 'box' | '478') => {
    setIsActive(false);
    setPattern(pt);
    setStepIndex(0);
    setTimeLeft(pt === 'box' ? BOX_STEPS[0].duration : G_STEPS[0].duration);
  };

  // Get current circular background animation scales
  const bubbleScale = isActive ? currentStep.scale : 1.15;
  const bubbleColor = isActive ? currentStep.color.split(' ')[0] : 'bg-white/30';
  const borderHighlight = isActive ? currentStep.color.split(' ')[2] : 'border-white/40';

  return (
    <div id="breathing-exercise" className="glass-card p-6 relative overflow-hidden flex flex-col items-center animate-none">
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-transparent z-10">
        <h3 className="font-sans font-medium text-earth-dark tracking-tight text-lg flex items-center gap-2">
          <Wind className="w-5 h-5 text-sage animate-pulse" />
          Somatic Lung Breathing
        </h3>
        {totalCompleted > 0 && (
          <span id="breathing-cycles-badge" className="text-xs font-sans text-sage-dark font-medium px-2.5 py-1 bg-white/45 rounded-full border border-white/50 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {totalCompleted} {totalCompleted === 1 ? 'Cycle' : 'Cycles'} Done
          </span>
        )}
      </div>

      {/* Select Pattern Tabs */}
      <div className="flex gap-2 bg-white/20 border border-white/30 p-1 rounded-xl mt-10 mb-8 w-full max-w-xs justify-center z-10">
        <button
          id="btn-pattern-box"
          onClick={() => handlePatternChange('box')}
          className={`flex-1 text-xs font-sans font-medium py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
            pattern === 'box' 
              ? 'bg-sage text-white shadow-xs font-bold' 
              : 'text-earth-muted/80 hover:bg-white/35'
          }`}
        >
          Box Breathing (4s Equal)
        </button>
        <button
          id="btn-pattern-478"
          onClick={() => handlePatternChange('478')}
          className={`flex-1 text-xs font-sans font-medium py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
            pattern === '478' 
              ? 'bg-sage text-white shadow-xs font-bold' 
              : 'text-earth-muted/80 hover:bg-white/35'
          }`}
        >
          Grounding 4-7-8
        </button>
      </div>

      {/* Somatic expansion bubble */}
      <div className="relative w-56 h-56 flex items-center justify-center my-4">
        {/* Golden-sun warm yellow pulsing backing aura */}
        <motion.div
          animate={{
            scale: bubbleScale * 1.15,
            opacity: isActive ? [0.15, 0.35, 0.15] : 0.12
          }}
          transition={{
            duration: isActive ? currentStep.duration : 4,
            ease: "easeInOut",
            repeat: Infinity
          }}
          className="absolute w-32 h-32 rounded-full bg-amber-200/40 blur-lg z-0"
        />

        {/* Breathing Ring Rhythms */}
        <motion.div
          animate={{
            scale: bubbleScale,
            opacity: isActive ? [0.4, 0.25, 0.4] : 0.3
          }}
          transition={{
            duration: isActive ? currentStep.duration : 4,
            ease: "easeInOut",
          }}
          className={`absolute w-36 h-36 rounded-full ${bubbleColor} blur-xl`}
        />
        
        {/* Border Ring */}
        <motion.div
          animate={{
            scale: bubbleScale,
          }}
          transition={{
            duration: isActive ? currentStep.duration : 4,
            ease: "easeInOut"
          }}
          className={`absolute w-40 h-40 rounded-full border-4 border-dashed ${borderHighlight} opacity-50`}
        />

        {/* Central Core Bubble */}
        <motion.div
          animate={{
            scale: bubbleScale,
          }}
          transition={{
            duration: isActive ? currentStep.duration : 4,
            ease: "easeInOut"
          }}
          className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-md border border-white/60 bg-gradient-to-tr ${
            isActive ? 'from-white/50 to-white/80' : 'from-white/35 to-white/55'
          } z-10`}
        >
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-center p-2"
              >
                <div className="font-sans text-[11px] uppercase tracking-widest text-sage-dark font-black leading-none flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {currentStep.state.replace('_', ' ')}
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <div className="font-mono text-3xl font-bold text-earth-dark tabular-nums my-1">
                  {timeLeft}s
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-2"
              >
                <Wind className="w-8 h-8 text-sage mx-auto opacity-70 animate-bounce" />
                <div className="font-sans text-xs text-earth-muted font-bold leading-tight mt-1.5">
                  Tap below to<br/>begin breath
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="text-center h-12 mt-4 max-w-sm px-4">
        <p className="font-sans text-sm text-earth-dark font-medium italic transition-all duration-300">
          {isActive ? currentStep.text : "Prepare to take a slow, mindful breath together with Sana..."}
        </p>
      </div>

      {/* Control Actions buttons */}
      <div className="flex gap-4 mt-4 w-full justify-center z-10 px-4">
        <button
          id="btn-breathing-toggle"
          onClick={handleToggle}
          className={`flex items-center gap-2 font-sans font-bold text-sm py-2 px-6 rounded-2xl transition-all shadow-sm cursor-pointer ${
            isActive 
              ? 'bg-earth-muted text-white hover:bg-earth-dark' 
              : 'bg-sage text-white hover:bg-sage-dark'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 fill-current animate-pulse" />
              Pause Practice
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              Begin Breathing
            </>
          )}
        </button>

        <button
          id="btn-breathing-reset"
          onClick={handleReset}
          className="flex items-center justify-center p-2.5 rounded-2xl bg-white/35 hover:bg-white/55 text-earth-dark transition-all border border-white/55 cursor-pointer"
          title="Reset tracker"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
