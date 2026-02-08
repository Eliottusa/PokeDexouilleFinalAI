// Simple synth sounds using Web Audio API
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
const ctx = new AudioContext();

export type SoundType = 'success' | 'error' | 'click' | 'battle-start' | 'battle-start-hard' | 'attack' | 'win' | 'lose' | 'evolve';

export const playSound = (type: SoundType) => {
  if (ctx.state === 'suspended') ctx.resume();
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);

  switch (type) {
    case 'success':
    case 'evolve':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
      break;
      
    case 'error':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    case 'click':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case 'battle-start':
      osc.type = 'square';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.setValueAtTime(220, now + 0.1);
      osc.frequency.setValueAtTime(110, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;

    case 'battle-start-hard':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.1);
      osc.frequency.linearRampToValueAtTime(55, now + 0.2);
      osc.frequency.linearRampToValueAtTime(220, now + 0.4);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
      break;

    case 'attack':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;

    case 'win':
      osc.type = 'triangle';
      // Arpeggio
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const t = now + i * 0.1;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        o.start(t);
        o.stop(t + 0.4);
      });
      break;

    case 'lose':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 1);
      osc.start(now);
      osc.stop(now + 1);
      break;
  }
};