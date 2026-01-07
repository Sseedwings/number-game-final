class SoundService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmActive = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  startBGM() {
    if (this.bgmActive) return;
    this.init();
    this.bgmActive = true;

    // 1. 깊은 우주의 베이스 드론 (Deep Bass Drone)
    // 매우 낮은 주파수로 묵직함을 제공
    const createDeepBass = (freq: number, gainVal: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.value = 150; // 고음역대 차단
      filter.Q.value = 1;

      gain.gain.setValueAtTime(0, this.ctx!.currentTime);
      gain.gain.linearRampToValueAtTime(gainVal, this.ctx!.currentTime + 5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
    };

    // 2. 부유하는 패드 (Floating Low-Mid Pad)
    const createPad = (freq: number, gainVal: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      filter.Q.value = 2;

      gain.gain.setValueAtTime(0, this.ctx!.currentTime);
      gain.gain.linearRampToValueAtTime(gainVal, this.ctx!.currentTime + 8);

      // 서서히 변하는 볼륨 LFO
      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.frequency.value = 0.05;
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
    };

    // 베이스 구성 (F Major/Minor 경계의 모호하고 묵직한 톤)
    createDeepBass(32.70, 0.25); // C1 (초저역)
    createDeepBass(43.65, 0.20); // F1
    createPad(65.41, 0.10);    // C2
    createPad(98.00, 0.05);    // G2

    // 고음역대 반짝임(Shimmer)은 피로도를 줄이기 위해 최소화
    const createSoftShimmer = (freq: number, delay: number) => {
      setTimeout(() => {
        if (!this.bgmActive) return;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;
        filter.type = 'lowpass';
        filter.frequency.value = 800; // 고음을 필터로 깎음

        gain.gain.setValueAtTime(0, this.ctx!.currentTime);
        gain.gain.linearRampToValueAtTime(0.015, this.ctx!.currentTime + 4);
        gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        osc.start();
        osc.stop(this.ctx!.currentTime + 8);
        
        createSoftShimmer(freq + (Math.random() * 5), 10000 + Math.random() * 5000);
      }, delay);
    };

    createSoftShimmer(440, 2000);
  }

  private osc(f: number, t: OscillatorType, d: number, v: number) {
    this.init();
    const o = this.ctx!.createOscillator();
    const g = this.ctx!.createGain();
    o.type = t; o.frequency.value = f;
    g.gain.setValueAtTime(v, this.ctx!.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + d);
    o.connect(g); g.connect(this.masterGain!);
    o.start(); o.stop(this.ctx!.currentTime + d);
  }

  playScan() { this.osc(400, 'sine', 0.2, 0.08); }
  playHighHint() { this.osc(400, 'sine', 0.4, 0.1); }
  playLowHint() { this.osc(200, 'sine', 0.4, 0.1); }
  playVictory() { 
    [261, 329, 392, 523].forEach((f, i) => {
      setTimeout(() => this.osc(f, 'sine', 3, 0.08), i * 200);
    });
  }
  playGameOver() { this.osc(30, 'sawtooth', 2, 0.15); }
  playReset() { this.osc(220, 'triangle', 0.5, 0.05); }
}
export const soundService = new SoundService();