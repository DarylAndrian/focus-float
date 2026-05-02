import { useState, useEffect, useCallback, useRef } from 'react';

// Sound types with descriptions
const SOUND_TYPES = {
  rain: {
    name: 'Rain',
    icon: 'fa-cloud-rain',
    description: 'Gentle rainfall'
  },
  forest: {
    name: 'Forest',
    icon: 'fa-tree',
    description: 'Birds and nature'
  },
  cafe: {
    name: 'Café',
    icon: 'fa-mug-hot',
    description: 'Ambient chatter'
  },
  white: {
    name: 'White Noise',
    icon: 'fa-wave-square',
    description: 'Pure white noise'
  },
  pink: {
    name: 'Pink Noise',
    icon: 'fa-water',
    description: 'Deeper, softer'
  }
};

export default function useFocusMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const audioContextRef = useRef(null);
  const sourceNodesRef = useRef(new Map());
  const gainNodeRef = useRef(null);

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = volume;
    }
    return audioContextRef.current;
  }, [volume]);

  // Generate white noise
  const createWhiteNoise = useCallback(() => {
    const ctx = initAudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }, [initAudioContext]);

  // Generate pink noise (more natural than white)
  const createPinkNoise = useCallback(() => {
    const ctx = initAudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }, [initAudioContext]);

  // Simulate rain sound
  const createRainSound = useCallback(() => {
    const ctx = initAudioContext();
    const whiteNoise = createWhiteNoise();

    // Add low-pass filter for softer sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    whiteNoise.connect(filter);
    filter.connect(gainNodeRef.current);

    return { source: whiteNoise, filter };
  }, [initAudioContext, createWhiteNoise]);

  // Simulate forest ambience
  const createForestSound = useCallback(() => {
    const ctx = initAudioContext();

    // Create multiple oscillators for nature sounds
    const oscillators = [];

    // Bird-like chirps (high frequency)
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 2000 + Math.random() * 1000;
      oscGain.gain.value = 0.01;

      osc.connect(oscGain);
      oscGain.connect(gainNodeRef.current);
      osc.start();
      oscillators.push({ osc, gain: oscGain });

      // Random chirps
      setInterval(() => {
        if (isPlaying) {
          oscGain.gain.value = 0 + Math.random() * 0.02;
          osc.frequency.value = 1500 + Math.random() * 2000;
        }
      }, 2000 + Math.random() * 3000);
    }

    // Soft pink noise for wind
    const pinkNoise = createPinkNoise();
    pinkNoise.connect(gainNodeRef.current);

    return {
      source: pinkNoise,
      oscillators,
      stop: () => {
        oscillators.forEach(({ osc }) => {
          try { osc.stop(); } catch (e) {}
        });
      }
    };
  }, [initAudioContext, createPinkNoise, isPlaying]);

  // Simulate café ambience
  const createCafeSound = useCallback(() => {
    const ctx = initAudioContext();
    const pinkNoise = createPinkNoise();

    // Add mid-frequency boost for conversation-like sound
    const midBoost = ctx.createBiquadFilter();
    midBoost.type = 'peaking';
    midBoost.frequency.value = 1000;
    midBoost.Q.value = 0.5;
    midBoost.gain.value = 6;

    pinkNoise.connect(midBoost);
    midBoost.connect(gainNodeRef.current);

    return {
      source: pinkNoise,
      filter: midBoost
    };
  }, [initAudioContext, createPinkNoise]);

  // Stop current sound
  const stopSound = useCallback(() => {
    sourceNodesRef.current.forEach((node, soundType) => {
      try {
        if (node.source) {
          node.source.stop();
          node.source.disconnect();
        }
        if (node.oscillators && node.stop) {
          node.stop();
        }
        if (node.filter) {
          node.filter.disconnect();
        }
      } catch (e) {}
    });
    sourceNodesRef.current.clear();
    setIsPlaying(false);
  }, []);

  // Start a sound
  const startSound = useCallback(async (soundType) => {
    try {
      const ctx = initAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Stop previous sound
      stopSound();

      let soundNode;

      switch (soundType) {
        case 'rain':
          soundNode = createRainSound();
          soundNode.source.start();
          break;
        case 'forest':
          soundNode = createForestSound();
          break;
        case 'cafe':
          soundNode = createCafeSound();
          soundNode.source.start();
          break;
        case 'white':
          const whiteSource = createWhiteNoise();
          soundNode = { source: whiteSource };
          whiteSource.start();
          break;
        case 'pink':
          const pinkSource = createPinkNoise();
          soundNode = { source: pinkSource };
          pinkSource.start();
          break;
        default:
          return;
      }

      sourceNodesRef.current.set(soundType, soundNode);
      setCurrentSound(soundType);
      setIsPlaying(true);
    } catch (e) {
      console.error('Error starting sound:', e);
    }
  }, [initAudioContext, stopSound, createRainSound, createForestSound, createCafeSound]);

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (isPlaying) {
      stopSound();
    } else {
      const sound = currentSound || 'pink';
      startSound(sound);
    }
  }, [isPlaying, currentSound, stopSound, startSound]);

  // Change volume
  const changeVolume = useCallback((newVolume) => {
    setVolume(newVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
    }
  }, []);

  // Change sound type
  const changeSound = useCallback((soundType) => {
    startSound(soundType);
  }, [startSound]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopSound]);

  return {
    isPlaying,
    currentSound,
    volume,
    sounds: SOUND_TYPES,
    toggle,
    startSound,
    stopSound,
    changeVolume,
    changeSound
  };
}
