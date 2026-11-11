/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Web Audio Engine for Billiards
class SoundEngine {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public musicEnabled: boolean = false;
  private musicInterval: number | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Authentic resin/ivory ball-to-ball clack
  public playBallHit(speed: number) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const clampedSpeed = Math.min(Math.max(speed, 0.05), 4.5);
    const volume = Math.min(1.0, (clampedSpeed / 3.0) * 0.9 + 0.1);
    const now = this.ctx.currentTime;

    // Transient click (sharp impact)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // High sharp transient frequency 2200Hz - 3400Hz
    const baseFreq = 2400 + (clampedSpeed * 280);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.035);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.Q.setValueAtTime(8.0, now);

    gain.gain.setValueAtTime(volume * 0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);

    // Resonant body click
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(1200 + Math.random() * 200, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    bodyGain.gain.setValueAtTime(volume * 0.45, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.sfxGain);

    bodyOsc.start(now);
    bodyOsc.stop(now + 0.065);
  }

  // Cushion rubber rail bounce
  public playCushionHit(speed: number) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const volume = Math.min(0.7, (speed / 3.0) * 0.6 + 0.1);
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.095);
  }

  // Cue stick strike on cue ball
  public playCueStrike(power: number) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const vol = Math.min(1.0, power * 0.7 + 0.3);

    // Leather tip smack
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.008));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);

    // Wood cue resonance
    const woodOsc = this.ctx.createOscillator();
    const woodGain = this.ctx.createGain();
    woodOsc.type = 'triangle';
    woodOsc.frequency.setValueAtTime(650, now);
    woodOsc.frequency.exponentialRampToValueAtTime(220, now + 0.06);

    woodGain.gain.setValueAtTime(vol * 0.4, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    woodOsc.connect(woodGain);
    woodGain.connect(this.sfxGain);

    woodOsc.start(now);
    woodOsc.stop(now + 0.07);
  }

  // Pocket drop sound (smooth velvety leather catch without harsh rattle)
  public playPocketDrop() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Smooth leather pocket catch - warm, pleasing low-thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.14);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Soft subtle foul indication (clean gentle cue chime without harsh buzzer)
  public playFoul() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(370, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Victory fanfare
  public playVictory() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C major arpeggio
    notes.forEach((freq, idx) => {
      const startTime = this.ctx!.currentTime + idx * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });
  }

  // UI button click
  public playClick() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Crisp rack balls clatter
  public playRack() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    for (let i = 0; i < 4; i++) {
      const delay = i * 0.04 + Math.random() * 0.02;
      setTimeout(() => {
        this.playBallHit(0.3 + Math.random() * 0.4);
      }, delay * 1000);
    }
  }

  // Lo-fi Pool Hall Ambient Music (procedural chords and mellow groove)
  public toggleMusic(enable?: boolean) {
    this.musicEnabled = enable !== undefined ? enable : !this.musicEnabled;
    if (this.musicEnabled) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
    return this.musicEnabled;
  }

  private startAmbientMusic() {
    this.stopAmbientMusic();
    this.init();
    if (!this.ctx || !this.musicGain) return;

    const chordProgression = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
    ];
    let chordIdx = 0;

    const playChordStep = () => {
      if (!this.ctx || !this.musicGain || !this.musicEnabled) return;
      const chord = chordProgression[chordIdx % chordProgression.length];
      chordIdx++;
      const now = this.ctx.currentTime;

      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 2.5);
      });
    };

    playChordStep();
    this.musicInterval = window.setInterval(playChordStep, 2600);
  }

  private stopAmbientMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sounds = new SoundEngine();
