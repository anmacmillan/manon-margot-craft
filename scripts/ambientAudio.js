/**
 * Procedural ambient music — gentle, slightly spooky pad in the style of
 * Minecraft's "Sweden" / cave drone tracks.
 *
 * Uses Web Audio so there's no MP3 to host, no licensing question, no extra
 * bundle weight. A handful of detuned sine oscillators feed a lowpass
 * filter and a long reverb-ish delay. Notes shift every ~12 seconds.
 *
 * Plays muted until the user starts the game (browser autoplay rules require
 * a user gesture); we resume the AudioContext on the launcher button click.
 */

const SCALE_C_MIXOLYDIAN = [220.00, 246.94, 277.18, 293.66, 329.63, 369.99, 392.00, 440.00];

export class AmbientAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.targetGain = 0.18;
    this.voices = [];
    this.scheduler = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      console.warn('[Audio] Web Audio not supported');
      return;
    }
    this.ctx = new AudioCtx();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    // Soft lowpass for a warm pad
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    filter.Q.value = 0.7;
    // Feedback delay for shimmer / cave reverb feel
    const delay = this.ctx.createDelay(2);
    delay.delayTime.value = 0.55;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.4;
    delay.connect(fb);
    fb.connect(delay);

    filter.connect(this.master);
    delay.connect(this.master);

    this.master.connect(this.ctx.destination);

    // Three voices — root, fifth, octave — slowly detuning around chosen notes
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = SCALE_C_MIXOLYDIAN[i];
      const voiceGain = this.ctx.createGain();
      voiceGain.gain.value = 0.6;
      // LFO on detune for slow movement
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07 + i * 0.03;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 8 + i * 4; // cents
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      osc.connect(voiceGain);
      voiceGain.connect(filter);
      voiceGain.connect(delay);
      osc.start();
      lfo.start();
      this.voices.push({ osc, gain: voiceGain });
    }

    // Drift the notes every ~12 seconds for evolving harmony
    this.scheduler = setInterval(() => {
      if (!this.ctx) return;
      const choose = () => SCALE_C_MIXOLYDIAN[Math.floor(Math.random() * SCALE_C_MIXOLYDIAN.length)];
      this.voices.forEach((v, i) => {
        const target = choose() * (i === 2 ? 2 : 1); // octave-up for top voice
        v.osc.frequency.setTargetAtTime(target, this.ctx.currentTime, 6);
      });
    }, 12000);

    // Fade master in
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.targetGain, this.ctx.currentTime, 4);
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    if (!this.ctx) return;
    this.muted = !this.muted;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.targetGain, this.ctx.currentTime, 0.5);
    return this.muted;
  }
}

let _instance = null;
export function getAmbientAudio() {
  if (!_instance) _instance = new AmbientAudio();
  return _instance;
}
