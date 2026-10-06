/**
 * Web Audio API High-Fidelity Tactical Gunshot, Bolt-Action & Hitmarker Synthesizer
 */

class TacticalAudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Powerful high-caliber sniper gunshot (.338 Lapua / .50 BMG crack + sub punch + tail)
  public playGunshot() {
    try {
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;

      // 1. Initial Supersonic Shockwave Crack (Bandpass filtered white noise burst)
      const bufferSize = this.ctx.sampleRate * 0.12;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const crackSource = this.ctx.createBufferSource();
      crackSource.buffer = noiseBuffer;

      const crackFilter = this.ctx.createBiquadFilter();
      crackFilter.type = 'bandpass';
      crackFilter.frequency.setValueAtTime(2400, t);
      crackFilter.frequency.exponentialRampToValueAtTime(800, t + 0.08);
      crackFilter.Q.setValueAtTime(3.0, t);

      const crackGain = this.ctx.createGain();
      crackGain.gain.setValueAtTime(1.2, t);
      crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      crackSource.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(this.ctx.destination);
      crackSource.start(t);

      // 2. Heavy Sub-Bass Kinetic Punch (Deep resonant thud)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(160, t);
      subOsc.frequency.exponentialRampToValueAtTime(38, t + 0.25);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(1.5, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + 0.38);

      // 3. Low-End Body Thump (Distorted triangle wave)
      const bodyOsc = this.ctx.createOscillator();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(90, t);
      bodyOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

      const bodyGain = this.ctx.createGain();
      bodyGain.gain.setValueAtTime(0.9, t);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(this.ctx.destination);
      bodyOsc.start(t);
      bodyOsc.stop(t + 0.45);

      // 4. Distant Outdoor Baseplate Echo Tail (Low-pass filtered long decay noise)
      const tailSize = this.ctx.sampleRate * 1.2;
      const tailBuffer = this.ctx.createBuffer(1, tailSize, this.ctx.sampleRate);
      const tailOutput = tailBuffer.getChannelData(0);
      for (let i = 0; i < tailSize; i++) {
        tailOutput[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.35));
      }

      const tailSource = this.ctx.createBufferSource();
      tailSource.buffer = tailBuffer;

      const tailFilter = this.ctx.createBiquadFilter();
      tailFilter.type = 'lowpass';
      tailFilter.frequency.setValueAtTime(1200, t);
      tailFilter.frequency.linearRampToValueAtTime(250, t + 1.0);

      const tailGain = this.ctx.createGain();
      tailGain.gain.setValueAtTime(0.6, t);
      tailGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

      tailSource.connect(tailFilter);
      tailFilter.connect(tailGain);
      tailGain.connect(this.ctx.destination);
      tailSource.start(t);
    } catch {
      // Ignore audio context errors if blocked
    }
  }

  // Realistic Metallic Bolt-Action Mechanical Sounds
  public playBoltUnlock() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // High metallic click
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    } catch {
      // Ignore
    }
  }

  public playBoltSlideBack() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.linearRampToValueAtTime(850, t + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    } catch {
      // Ignore
    }
  }

  public playBoltSlideForward() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.linearRampToValueAtTime(400, t + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    } catch {
      // Ignore
    }
  }

  public playBoltLock() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Heavy solid latch lock click
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.04);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.09);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    } catch {
      // Ignore
    }
  }

  // Crisp Tactile Target Hitmarker Audio Cue
  public playHitmarker() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // High-pitch tactical hit ping
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1950, t);
      osc.frequency.setValueAtTime(2400, t + 0.03);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      // Ignore
    }
  }
}

export const soundEngine = new TacticalAudioEngine();
