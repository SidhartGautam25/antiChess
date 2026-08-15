import { Platform } from 'react-native';

let AudioContextClass: any = null;
let audioCtx: any = null;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
}

// Function to synthesize chess sounds using Web Audio API (very low latency, offline-safe)
function playWebSound(type: 'move' | 'capture') {
  if (!AudioContextClass) return;
  try {
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const t = audioCtx.currentTime;

    if (type === 'move') {
      // Wood-like Chess Move "Click"
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    } else {
      // Chess Capture "Clack" (Double sound)
      // First click
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(320, t);
      osc1.frequency.exponentialRampToValueAtTime(80, t + 0.06);

      gain1.gain.setValueAtTime(0.4, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);

      osc1.start(t);
      osc1.stop(t + 0.06);

      // Second click (slightly delayed and lower frequency)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(220, t + 0.035);
      osc2.frequency.exponentialRampToValueAtTime(60, t + 0.12);

      gain2.gain.setValueAtTime(0.3, t + 0.035);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);

      osc2.start(t + 0.035);
      osc2.stop(t + 0.12);
    }
  } catch (e) {
    console.warn('Web Audio synthesis failed:', e);
  }
}

// Keep a map of players pre-created for native platforms (loaded instantly from local bundle)
let movePlayer: any = null;
let capturePlayer: any = null;

// Initialize players immediately if on native platform to pre-buffer them
if (Platform.OS !== 'web') {
  try {
    const { createAudioPlayer } = require('expo-audio');
    const moveSource = require('../../assets/sounds/move.mp3');
    const captureSource = require('../../assets/sounds/capture.mp3');
    
    movePlayer = createAudioPlayer(moveSource);
    capturePlayer = createAudioPlayer(captureSource);
  } catch (e) {
    console.warn('Failed to pre-initialize native audio players:', e);
  }
}

function playNativeSound(type: 'move' | 'capture') {
  try {
    const player = type === 'move' ? movePlayer : capturePlayer;
    if (player) {
      player.seekTo(0);
      player.play();
    } else {
      // Fallback lazy initialization if not already initialized
      const { createAudioPlayer } = require('expo-audio');
      const moveSource = require('../../assets/sounds/move.mp3');
      const captureSource = require('../../assets/sounds/capture.mp3');
      
      const newPlayer = createAudioPlayer(type === 'move' ? moveSource : captureSource);
      if (type === 'move') movePlayer = newPlayer;
      else capturePlayer = newPlayer;
      
      newPlayer.play();
    }
  } catch (e) {
    console.warn('Native Audio playback failed:', e);
  }
}

export function playSound(type: 'move' | 'capture') {
  if (Platform.OS === 'web') {
    playWebSound(type);
  } else {
    playNativeSound(type);
  }
}
