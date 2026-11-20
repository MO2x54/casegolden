class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal: number = 0.12,
    delay: number = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public diceRoll() {
    const freqs = [240, 320, 270, 360, 290, 420];
    freqs.forEach((f, i) => {
      this.playTone(f, 0.045, 'triangle', 0.08, i * 0.045);
    });
  }

  public step() {
    this.playTone(520, 0.05, 'sine', 0.06);
  }

  public cashIn() {
    this.playTone(660, 0.11, 'sine', 0.11, 0);
    this.playTone(880, 0.16, 'sine', 0.12, 0.08);
    this.playTone(1174, 0.22, 'triangle', 0.1, 0.16);
  }

  public cashOut() {
    this.playTone(340, 0.12, 'triangle', 0.1, 0);
    this.playTone(220, 0.2, 'sine', 0.11, 0.09);
  }

  public buyProperty() {
    this.playTone(523.25, 0.12, 'triangle', 0.12, 0);
    this.playTone(659.25, 0.12, 'triangle', 0.12, 0.08);
    this.playTone(783.99, 0.22, 'sine', 0.13, 0.16);
  }

  public cardFlip() {
    this.playTone(440, 0.08, 'sine', 0.09, 0);
    this.playTone(587.33, 0.14, 'triangle', 0.1, 0.07);
  }

  public courtGavel() {
    this.playTone(180, 0.1, 'square', 0.09, 0);
    this.playTone(145, 0.14, 'square', 0.1, 0.14);
    this.playTone(220, 0.28, 'sawtooth', 0.06, 0.28);
  }

  public auctionBid() {
    this.playTone(784, 0.09, 'sine', 0.1, 0);
    this.playTone(987.77, 0.12, 'sine', 0.09, 0.06);
  }

  public auctionWin() {
    this.playTone(523.25, 0.1, 'triangle', 0.11, 0);
    this.playTone(659.25, 0.1, 'triangle', 0.11, 0.09);
    this.playTone(783.99, 0.1, 'triangle', 0.11, 0.18);
    this.playTone(1046.5, 0.28, 'sine', 0.13, 0.27);
  }

  public jail() {
    this.playTone(260, 0.15, 'sawtooth', 0.08, 0);
    this.playTone(196, 0.22, 'sawtooth', 0.09, 0.12);
    this.playTone(130.81, 0.35, 'triangle', 0.11, 0.26);
  }

  public chatPop() {
    this.playTone(740, 0.06, 'sine', 0.06, 0);
  }

  public victory() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const delays = [0, 0.1, 0.2, 0.32, 0.48, 0.6];
    notes.forEach((n, idx) => {
      this.playTone(n, idx === notes.length - 1 ? 0.5 : 0.14, 'triangle', 0.13, delays[idx]);
    });
  }
}

export const soundEngine = new SoundEngine();
