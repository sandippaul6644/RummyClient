// Web Audio API Synthesizer for high-performance sound effects without external audio file dependencies

let userHasInteracted = false;

// Attach one-time user interaction listeners to unlock AudioContext cleanly without browser warnings
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    userHasInteracted = true;
    sound.resumeContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true, capture: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, capture: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true, capture: true });
}

class SoundManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;

    // Flight synthesizer nodes
    this._flightNodes = null;
  }

  resumeContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) {
        try {
          this.ctx = new AudioCtor();
        } catch {}
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  init() {
    // Only instantiate/resume if user has actually interacted with the document
    if (!userHasInteracted) return false;
    this.resumeContext();
    return Boolean(this.ctx);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopFlightSound();
    }
    return this.enabled;
  }

  playClick() {
    if (!this.enabled || !this.init() || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  playDiceRoll() {
    if (!this.enabled || !this.init() || !this.ctx) return;
    try {
      for (let i = 0; i < 7; i++) {
        const time = this.ctx.currentTime + i * 0.08 + Math.random() * 0.03;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300 + Math.random() * 450, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.04);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.04);
      }
    } catch {}
  }

  playBeep(isHigh = false) {
    if (!this.enabled || !this.init() || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isHigh ? 880 : 440, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  playWarning() {
    if (!this.enabled || !this.init() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [320, 260].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.14, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.08);
      });
    } catch {}
  }

  playWin() {
    if (!this.enabled || !this.init() || !this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.08);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + index * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + index * 0.08);
        osc.stop(this.ctx.currentTime + index * 0.08 + 0.2);
      });
    } catch {}
  }

  playCrash() {
    this.stopFlightSound();
    if (!this.enabled || !this.init() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Sub-bass crash explosion
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // Noise explosion burst
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch {}
  }

  playCashout() {
    if (!this.enabled || !this.init() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Sparkling success double chime
      [587.33, 880, 1174.66].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.2, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.22);
      });
    } catch {}
  }

  /**
   * Continuous Flight Engine Hum & Jet Afterburner Sound
   * Smooth, enjoyable, builds thrilling suspense as multiplier increases.
   */
  startFlightSound() {
    if (!this.enabled || !this.init() || !this.ctx) return;
    this.stopFlightSound(); // ensure clean state

    try {
      const now = this.ctx.currentTime;

      // 1. Low engine drone (sub-rumble)
      const rumbleOsc = this.ctx.createOscillator();
      rumbleOsc.type = 'triangle';
      rumbleOsc.frequency.setValueAtTime(75, now);

      // 2. Jet turbine spool whistle
      const turbineOsc = this.ctx.createOscillator();
      turbineOsc.type = 'sine';
      turbineOsc.frequency.setValueAtTime(260, now);

      // Lowpass filter to keep sound soft and pleasant
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(1.5, now);

      // Master flight gain
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      // Soft fade-in over 0.25s (comfortable volume)
      masterGain.gain.linearRampToValueAtTime(0.09, now + 0.25);

      rumbleOsc.connect(filter);
      turbineOsc.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(this.ctx.destination);

      rumbleOsc.start(now);
      turbineOsc.start(now);

      this._flightNodes = {
        rumbleOsc,
        turbineOsc,
        filter,
        masterGain,
      };
    } catch {}
  }

  updateFlightPitch(multiplier = 1.0) {
    if (!this.enabled || !this._flightNodes || !this.ctx) return;
    try {
      const mult = Math.max(1, Math.min(multiplier, 25));
      const now = this.ctx.currentTime;
      // Rumble climbs gently from 75Hz to 160Hz
      const rumbleFreq = 75 + Math.log2(mult) * 22;
      // Turbine climbs smoothly from 260Hz to 620Hz
      const turbineFreq = 260 + Math.log2(mult) * 75;
      // Filter opens up for brighter jet presence
      const filterFreq = Math.min(1800, 450 + Math.log2(mult) * 240);

      this._flightNodes.rumbleOsc.frequency.setTargetAtTime(rumbleFreq, now, 0.1);
      this._flightNodes.turbineOsc.frequency.setTargetAtTime(turbineFreq, now, 0.1);
      this._flightNodes.filter.frequency.setTargetAtTime(filterFreq, now, 0.1);
    } catch {}
  }

  stopFlightSound() {
    if (!this._flightNodes) return;
    try {
      const nodes = this._flightNodes;
      this._flightNodes = null;
      if (this.ctx) {
        const now = this.ctx.currentTime;
        nodes.masterGain.gain.setTargetAtTime(0.0001, now, 0.08);
        setTimeout(() => {
          try {
            nodes.rumbleOsc.stop();
            nodes.turbineOsc.stop();
            nodes.rumbleOsc.disconnect();
            nodes.turbineOsc.disconnect();
            nodes.filter.disconnect();
            nodes.masterGain.disconnect();
          } catch {}
        }, 120);
      }
    } catch {
      this._flightNodes = null;
    }
  }
}

export const sound = new SoundManager();
