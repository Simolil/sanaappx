import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Play, Square, Sparkles, Flame, Waves } from 'lucide-react';

type SoundProfile = 'drone' | 'waves' | 'fireplace';

interface SoundProfileConfig {
  id: SoundProfile;
  name: string;
  description: string;
  icon: any;
  color: string;
}

const PROFILES: SoundProfileConfig[] = [
  {
    id: 'drone',
    name: 'Cosmic Slate Pad',
    description: 'A deep, nourishing structural synthesizer chord pulsing slowly.',
    icon: Sparkles,
    color: 'from-sage-soft to-sage-pale'
  },
  {
    id: 'waves',
    name: 'Ocean Grounding Wave',
    description: 'Pink-noise modulated gently to mimic the tide breath.',
    icon: Waves,
    color: 'from-ocean-soft to-ocean-pale'
  },
  {
    id: 'fireplace',
    name: 'Kindling Embers',
    description: 'Soft crackling fire sounds layered with a warm sub-bass.',
    icon: Flame,
    color: 'from-sage-pale to-ocean-soft'
  }
];

export default function SynthSoundscape() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeProfile, setActiveProfile] = useState<SoundProfile>('drone');
  const [volume, setVolume] = useState<number>(0.4);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const synthNodesRef = useRef<any[]>([]);
  const flameIntervalRef = useRef<any>(null);

  // Stop any playing sound nodes cleanly
  const stopSynth = () => {
    if (flameIntervalRef.current) {
      clearInterval(flameIntervalRef.current);
      flameIntervalRef.current = null;
    }
    synthNodesRef.current.forEach(node => {
      try {
        node.stop();
      } catch (e) {}
    });
    synthNodesRef.current = [];
  };

  const startSynth = () => {
    stopSynth();

    // Create AudioContext if not exists
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Set up master volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    if (activeProfile === 'drone') {
      // Create slow pulsating synthesizer pads (harmonic minor chords of comforting frequencies)
      const frequencies = [110, 165, 220, 275, 330]; // A2, E3, A3, C#4, E4
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Slow individual oscillators detuned slightly for warm phasing choruser
        osc.detune.setValueAtTime((Math.random() - 0.5) * 12, ctx.currentTime);

        // Low frequency oscillator (LFO) for natural breathing pulse
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.05 + idx * 0.02, ctx.currentTime); // very slow
        lfoGain.gain.setValueAtTime(0.05, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);

        // Lowpass filter to make it deeply warm, dark and anti-clinical
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        oscGain.gain.setValueAtTime(0.08 / frequencies.length, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(filter);
        filter.connect(masterGain);

        osc.start();
        lfo.start();

        synthNodesRef.current.push(osc, lfo);
      });
    } else if (activeProfile === 'waves') {
      // Synthesize pink/white noise-based wind and wave textures
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      // Let's generate white noise as baseline
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      const waveGain = ctx.createGain();
      waveGain.gain.setValueAtTime(0.15, ctx.currentTime);

      // Pulse filter and gain together with LFO to model rolling ocean tide (6s inhale, 6s exhale) LFO = 0.08 Hz
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
      lfoGain.gain.setValueAtTime(180, ctx.currentTime); // modulated frequency range

      // Map LFO to Filter Frequency (makes waves rise and fall in pitch)
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      // Volume pulsation
      const lfoVolNode = ctx.createGain();
      const lfoVol = ctx.createOscillator();
      lfoVol.frequency.setValueAtTime(0.08, ctx.currentTime);
      const volMod = ctx.createGain();
      volMod.gain.setValueAtTime(0.08, ctx.currentTime);
      
      lfoVol.connect(volMod);
      volMod.connect(waveGain.gain);

      whiteNoise.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(masterGain);

      whiteNoise.start();
      lfo.start();
      lfoVol.start();

      synthNodesRef.current.push(whiteNoise, lfo, lfoVol);
    } else if (activeProfile === 'fireplace') {
      // Low rumble hum for ambient heat
      const subOsc = ctx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(75, ctx.currentTime);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.08, ctx.currentTime);
      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start();
      synthNodesRef.current.push(subOsc);

      // Generate crackling high-pass transients
      const crackleGenerator = () => {
        if (!isPlaying && !audioCtxRef.current) return;
        
        // Randomly play rapid short bursts of sound
        const triggerProbability = 0.35;
        if (Math.random() < triggerProbability) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(1500 + Math.random() * 2000, ctx.currentTime);

          filter.type = 'highpass';
          filter.frequency.setValueAtTime(3000, ctx.currentTime);

          gain.gain.setValueAtTime(0.01 + Math.random() * 0.03, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02 + Math.random() * 0.06);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);

          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        }
      };

      flameIntervalRef.current = setInterval(crackleGenerator, 80);
    }
  };

  // Adjust volume active changes
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(volume, audioCtxRef.current.currentTime + 0.1);
    }
  }, [volume]);

  // Restart synthesizer when active profile swaps during playback
  useEffect(() => {
    if (isPlaying) {
      startSynth();
    }
  }, [activeProfile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSynth();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSynth();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Wait for React state cycle to finish, or pull current states
      setTimeout(() => {
        startSynth();
      }, 50);
    }
  };

  return (
    <div id="synth-soundscape" className="bg-warm border border-sage-soft rounded-3xl p-6 select-none relative overflow-hidden backdrop-blur-md animate-none">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sage-soft/10 rounded-full blur-2xl -mr-10 -mt-10" />
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-sans font-medium text-earth-dark tracking-tight text-lg flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-sage-dark animate-pulse" />
            Ambient Grounding Synth
          </h3>
          <p className="font-sans text-xs text-earth-muted mt-0.5">
            Soothing real-time soundscapes computed live in your browser.
          </p>
        </div>
        
        <button
          id="soundscape-play-btn"
          onClick={handleTogglePlay}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm cursor-pointer ${
            isPlaying 
              ? 'bg-sage text-white hover:bg-sage-dark' 
              : 'bg-sage-soft text-sage-dark hover:bg-sage-pale'
          }`}
        >
          {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 my-5">
        {PROFILES.map((profile) => {
          const IconComponent = profile.icon;
          const isActive = activeProfile === profile.id;
          return (
            <div
              id={`profile-card-${profile.id}`}
              key={profile.id}
              onClick={() => setActiveProfile(profile.id)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center gap-3.5 ${
                isActive 
                  ? 'bg-sage-soft/40 border-sage shadow-xs' 
                  : 'bg-white hover:bg-sage-pale/45 border-sage-soft/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${profile.color} flex items-center justify-center text-sage-dark`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-sans text-sm font-medium text-earth-dark leading-tight">
                  {profile.name}
                </h4>
                <p className="font-sans text-xs text-earth-muted truncate mt-0.5">
                  {profile.description}
                </p>
              </div>
              
              {isActive && isPlaying && (
                <div id="playing-equalizer-bars" className="flex items-end gap-0.5 h-3">
                  <div className="w-0.5 h-full rounded-full bg-sage animate-[bounce_1s_infinite_100ms]" />
                  <div className="w-0.5 h-2/3 rounded-full bg-sage animate-[bounce_1s_infinite_300ms]" />
                  <div className="w-0.5 h-5/6 rounded-full bg-sage animate-[bounce_1s_infinite_500ms]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-earth-dark font-bold font-sans px-1">
          <span className="flex items-center gap-1.5 grayscale" style={{ filter: isPlaying ? 'none' : 'grayscale(1)' }}>
            {volume === 0 ? <VolumeX className="w-4 h-4 text-sage-dark" /> : <Volume2 className="w-4 h-4 text-sage-dark" />}
            Volume
          </span>
          <span className="font-mono text-[10px] text-earth-muted">{Math.round(volume * 100)}%</span>
        </div>
        <input
          id="soundscape-volume-slider"
          type="range"
          min="0"
          max="0.8"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          disabled={!isPlaying}
          className="w-full accent-sage h-1 bg-sage-soft rounded-lg cursor-pointer transition-opacity duration-300 disabled:opacity-40"
        />
      </div>
    </div>
  );
}
