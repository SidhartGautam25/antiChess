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

// Function to play sound using expo-av on native platforms
async function playNativeSound(type: 'move' | 'capture') {
  try {
    const { Audio } = require('expo-av');
    const moveUrl = 'https://lichess.org/assets/sound/standard/Move.mp3';
    const captureUrl = 'https://lichess.org/assets/sound/standard/Capture.mp3';
    
    const { sound } = await Audio.Sound.createAsync(
      { uri: type === 'move' ? moveUrl : captureUrl },
      { shouldPlay: true }
    );
    
    // Automatically unload sound from memory when done
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
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
