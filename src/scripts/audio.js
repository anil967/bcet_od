// Odyssey Audio System — Continuous bowXclench.mp3.mpeg soundtrack playback

class OdysseyAudioSystem {
  constructor() {
    this.bgMusic = document.getElementById('odyssey-bg-music') || new Audio('/bowXclench.mp3.mpeg');
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.6;
    this.bgMusic.muted = false;
    this.audioCtx = null;
    this._wasPlayingBeforeHidden = false;

    this.init();
  }

  init() {
    this._gestureListenersBound = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        this._wasPlayingBeforeHidden = !!this.bgMusic && !this.bgMusic.paused;
        if (this._wasPlayingBeforeHidden) this.bgMusic.pause();
        return;
      }

      if (this._wasPlayingBeforeHidden && this.bgMusic && this.bgMusic.paused) {
        this.bgMusic.play().then(() => {
          this._removeGestureListeners();
        }).catch(() => {
          this._addGestureListeners();
        });
      }
      this._wasPlayingBeforeHidden = false;
    });

    const tryPlay = () => {
      if (!this.bgMusic || !this.bgMusic.paused) return;
      const promise = this.bgMusic.play();
      if (promise !== undefined) {
        promise.then(() => {
          // Autoplay succeeded — remove gesture fallback listeners if they were added
          this._removeGestureListeners();
        }).catch(() => {
          // Browser blocked autoplay — add one-time user gesture fallback
          this._addGestureListeners();
        });
      }
    };

    // Attempt autoplay at earliest opportunity
    this.playBackgroundMusic();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => tryPlay());
    }
    window.addEventListener('load', () => tryPlay());
  }

  _addGestureListeners() {
    if (this._gestureListenersBound) return;
    this._gestureListenersBound = true;

    this._gestureHandler = () => {
      if (this.bgMusic && this.bgMusic.paused) {
        this.bgMusic.play().then(() => {
          this._removeGestureListeners();
        }).catch(() => {
          // Still blocked — listeners remain for next interaction
        });
      } else {
        // Already playing — clean up
        this._removeGestureListeners();
      }
    };

    ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, this._gestureHandler, { passive: true, capture: true });
    });
  }

  _removeGestureListeners() {
    if (!this._gestureListenersBound) return;
    ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
      window.removeEventListener(evt, this._gestureHandler, { capture: true });
    });
    this._gestureListenersBound = false;
  }

  playBackgroundMusic() {
    if (this.bgMusic) {
      this.bgMusic.muted = false;
      if (this.bgMusic.paused) {
        const promise = this.bgMusic.play();
        if (promise !== undefined) {
          promise.then(() => {
            this._removeGestureListeners();
          }).catch(() => {
            this._addGestureListeners();
          });
        }
      }
    }
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playClick() {}

  playLyreArpeggio() {}

  playTriumph() {}
}

export const audioSystem = new OdysseyAudioSystem();
