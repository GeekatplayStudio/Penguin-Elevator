// Background music tracks (compressed from Suno originals) + chiptune SFX via Web Audio API
const BG_TRACKS = ['/audio/bg-1.mp3', '/audio/bg-2.mp3', '/audio/bg-3.mp3', '/audio/bg-4.mp3'];
const GAME_OVER_TRACKS = ['/audio/gameover-1.mp3', '/audio/gameover-2.mp3'];
const MUSIC_VOLUME = 0.35;
const GAME_OVER_VOLUME = 0.45;

const pickRandom = (list: string[], exclude?: string): string => {
  const pool = list.length > 1 && exclude ? list.filter(t => t !== exclude) : list;
  return pool[Math.floor(Math.random() * pool.length)];
};

class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicNodes: AudioScheduledSourceNode[] = [];
  private muted: boolean = false;
  private musicEl: HTMLAudioElement | null = null;
  private gameOverEl: HTMLAudioElement | null = null;
  private lastBgTrack: string | undefined;

  public unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.25;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private init() {
    this.unlock();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.25;
    }
    if (this.musicEl) this.musicEl.muted = muted;
    if (this.gameOverEl) this.gameOverEl.muted = muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  // Picks a random track from the compressed background pool and loops it
  public playMusic() {
    this.init();
    this.stopGameOverMusic();

    const track = pickRandom(BG_TRACKS, this.lastBgTrack);
    this.lastBgTrack = track;

    if (!this.musicEl) {
      this.musicEl = new Audio();
      this.musicEl.loop = true;
    }
    this.musicEl.muted = this.muted;
    this.musicEl.volume = MUSIC_VOLUME;
    if (this.musicEl.src !== window.location.origin + track) {
      this.musicEl.src = track;
    }
    this.musicEl.currentTime = 0;
    this.musicEl.play().catch(() => {
      // Autoplay was blocked - will retry on the next user gesture via unlock()
    });
  }

  public stopMusic() {
    if (this.musicEl) {
      this.musicEl.pause();
      this.musicEl.currentTime = 0;
    }
    // Legacy synthesized nodes (kept for safety if ever re-enabled)
    this.musicNodes.forEach(node => {
      try { node.stop(); } catch (e) {}
      node.disconnect();
    });
    this.musicNodes = [];
  }

  // Plays a random game-over track once, replacing the background loop
  public playGameOverMusic() {
    this.stopMusic();
    const track = pickRandom(GAME_OVER_TRACKS);
    if (!this.gameOverEl) {
      this.gameOverEl = new Audio();
      this.gameOverEl.loop = false;
    }
    this.gameOverEl.muted = this.muted;
    this.gameOverEl.volume = GAME_OVER_VOLUME;
    this.gameOverEl.src = track;
    this.gameOverEl.currentTime = 0;
    this.gameOverEl.play().catch(() => {});
  }

  public stopGameOverMusic() {
    if (this.gameOverEl) {
      this.gameOverEl.pause();
      this.gameOverEl.currentTime = 0;
    }
  }

  // 16-Bit Elevator Floor Chime (Arpeggiated Square Chime)
  public playChime() {
    this.init();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0.12, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.25);
    });
  }

  // 16-Bit Pixel Fall Whistle
  public playFall() {
    this.init();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.45);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  // Funny falling "Ooohhh~" voice - triangle wave through a wobbling bandpass
  // filter so it reads as a cartoon vowel rather than a plain tone, sliding
  // down in pitch like the penguin is tumbling through the trapdoor.
  public playDropOooh() {
    this.init();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.55);

    vibrato.type = 'sine';
    vibrato.frequency.value = 11;
    vibratoGain.gain.value = 18;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.55);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.28, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    vibrato.start(t);
    osc.stop(t + 0.6);
    vibrato.stop(t + 0.6);
  }

  // Witness scream - a sharp, high, slightly detuned "AAH!" chorus that
  // plays the instant a penguin spots a drop, distinct from the alarm siren.
  public playScream() {
    this.init();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const t = this.ctx.currentTime;
    [0, 0.25, 0.50, 0.75].forEach((delay) => {
      [0, -18, 14].forEach((detune, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.detune.value = detune;
        osc.frequency.setValueAtTime(800, t + delay);
        osc.frequency.exponentialRampToValueAtTime(1500, t + delay + 0.08);
        osc.frequency.exponentialRampToValueAtTime(600, t + delay + 0.22);

        gain.gain.setValueAtTime(0.0001, t + delay);
        gain.gain.exponentialRampToValueAtTime(i === 0 ? 0.35 : 0.18, t + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + delay);
        osc.stop(t + delay + 0.22);
      });
    });
  }

  // 16-Bit Cute Penguin Quack Chirp
  public playEnter() {
    this.init();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.setValueAtTime(900, t + 0.05);
    osc.frequency.setValueAtTime(750, t + 0.1);
    
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // 16-Bit Fish Splash Sound
  public playSplash() {
    this.init();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.08);
    osc.frequency.linearRampToValueAtTime(400, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // 16-Bit Panic Alarm Siren
  public playPanic() {
    this.init();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.1);
    osc.frequency.linearRampToValueAtTime(400, t + 0.2);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }
  
  // 16-Bit Trapdoor Mechanical Click
  public playTrapdoor() {
    this.init();
    if (!this.ctx || !this.masterGain || this.muted) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.setValueAtTime(110, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // 16-Bit Combo Fanfare
  public playCombo() {
    this.init();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.18);
    });
  }
}

export const audioManager = new AudioController();
