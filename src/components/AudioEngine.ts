class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialisation of AudioContext is handled on user interaction
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('retro_chess_mute');
      this.isMuted = savedMute === 'true';
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('retro_chess_mute', String(this.isMuted));
    return this.isMuted;
  }

  public getMuteStatus(): boolean {
    return this.isMuted;
  }

  public playMove() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square'; // Classic retro sound
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(320, time + 0.08);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.linearRampToValueAtTime(0.01, time + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  public playCapture() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const duration = 0.25;

    // Triangle glide down
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, time);
    osc.frequency.linearRampToValueAtTime(80, time + duration);
    
    oscGain.gain.setValueAtTime(0.12, time);
    oscGain.gain.linearRampToValueAtTime(0.01, time + duration);
    
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    
    osc.start(time);
    osc.stop(time + duration);

    // Dynamic noise burst for retro punch/crumble
    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1000, time);
      noiseFilter.frequency.linearRampToValueAtTime(200, time + 0.15);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, time);
      noiseGain.gain.linearRampToValueAtTime(0.01, time + 0.15);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(time);
      noise.stop(time + 0.15);
    } catch (e) {
      // Fallback if audio buffer creation fails (uncommon)
    }
  }

  public playCheck() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    
    // High alert retro warning chord (Perfect 5th or Minor 2nd combo)
    const runSquare = (freq: number, startDelay: number, len: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time + startDelay);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.setValueAtTime(0.06, time + startDelay);
      gain.gain.linearRampToValueAtTime(0, time + startDelay + len);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time + startDelay);
      osc.stop(time + startDelay + len);
    }

    runSquare(440, 0, 0.12);
    runSquare(466, 0.04, 0.12); // Dissonant minor second for urgency!
    runSquare(587, 0.08, 0.25);
  }

  public playTextScroll() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Standard blip sound for typing characters (triggered sparsely)
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Slightly randomized pitch for cute talking effect
    const freq = 450 + Math.random() * 150;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.02, time);
    gain.gain.linearRampToValueAtTime(0, time + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, time);

    gain.gain.setValueAtTime(0.04, time);
    gain.gain.linearRampToValueAtTime(0, time + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.04);
  }

  public playVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    // Classic NES happy arpeggio: C4 -> E4 -> G4 -> C5 -> E5 -> G5 -> C6!
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    const step = 0.08;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time + (idx * step));
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.setValueAtTime(0.06, time + (idx * step));
      gain.gain.linearRampToValueAtTime(0.01, time + (idx * step) + (step * 2));
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(time + (idx * step));
      osc.stop(time + (idx * step) + (step * 2.5));
    });
  }

  public playDefeat() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    // Sad falling slide sound: C3 -> G2 -> E2 -> C2 with low square tone
    const notes = [130.81, 98.00, 82.41, 65.41];
    const step = 0.15;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time + (idx * step));
      osc.frequency.linearRampToValueAtTime(freq * 0.8, time + (idx * step) + step);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.setValueAtTime(0.08, time + (idx * step));
      gain.gain.linearRampToValueAtTime(0, time + (idx * step) + step);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(time + (idx * step));
      osc.stop(time + (idx * step) + step);
    });
  }

  // Soft low hum or pitch bend for a retro startup sound
  public playStartup() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(100, time);
    osc1.frequency.exponentialRampToValueAtTime(400, time + 0.3);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(150, time);
    osc2.frequency.exponentialRampToValueAtTime(600, time + 0.3);

    gain.gain.setValueAtTime(0.05, time);
    gain.gain.linearRampToValueAtTime(0, time + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(time);
    osc1.stop(time + 0.45);
    osc2.start(time);
    osc2.stop(time + 0.45);
  }
}

export const audioEngine = new AudioEngine();
