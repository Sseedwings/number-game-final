
class SoundService {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private isBgmPlaying = false;

  private init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  startBGM() {
    if (this.isBgmPlaying) return;
    this.init();
    this.isBgmPlaying = true;
    this.bgmGain = this.ctx!.createGain();
    this.bgmGain.gain.setValueAtTime(0, this.ctx!.currentTime);
    // BGM 볼륨 0.5 상향
    this.bgmGain.gain.linearRampToValueAtTime(0.5, this.ctx!.currentTime + 6);
    this.bgmGain.connect(this.ctx!.destination);

    const drone = (f: number, v: number) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.frequency.value = f;
      g.gain.value = v;
      o.connect(g); g.connect(this.bgmGain!);
      o.start();
      const lfo = this.ctx!.createOscillator();
      const lg = this.ctx!.createGain();
      lfo.frequency.value = 0.1; lg.gain.value = 4;
      lfo.connect(lg); lg.connect(o.frequency);
      lfo.start();
    };
    drone(43.65, 0.15); // F1
    drone(65.41, 0.1);  // C2
    drone(87.31, 0.08); // F2
  }

  private osc(f: number, t: OscillatorType, d: number, v: number) {
    this.init();
    const o = this.ctx!.createOscillator();
    const g = this.ctx!.createGain();
    o.type = t; o.frequency.value = f;
    g.gain.setValueAtTime(v, this.ctx!.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + d);
    o.connect(g); g.connect(this.ctx!.destination);
    o.start(); o.stop(this.ctx!.currentTime + d);
  }

  playScan() { this.osc(1000, 'sine', 0.5, 0.2); }
  playSageIntro() { [440, 554, 659].forEach((f, i) => setTimeout(() => this.osc(f, 'sine', 1, 0.15), i * 150)); }
  playHighHint() { this.osc(700, 'sine', 0.6, 0.2); }
  playLowHint() { this.osc(300, 'sine', 0.6, 0.2); }
  playVictory() { [523, 659, 783, 1046, 1318].forEach((f, i) => setTimeout(() => this.osc(f, 'sine', 4, 0.15), i * 120)); }
  playGameOver() { this.osc(50, 'sine', 3, 0.3); }
  playReset() { this.osc(330, 'triangle', 0.8, 0.1); }
}
export const soundService = new SoundService();
