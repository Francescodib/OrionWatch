import { create } from "zustand";

interface PlaybackStore {
  isPlaying: boolean;
  playbackTime: number | null; // epoch ms, null = live
  playbackSpeed: number; // 1, 10, 100, 1000
  missionStart: number; // epoch ms
  missionEnd: number; // epoch ms (or now if mission active)

  play: () => void;
  pause: () => void;
  setPlaybackTime: (t: number) => void;
  setPlaybackSpeed: (s: number) => void;
  goLive: () => void;
  tick: (deltaMs: number) => void; // advance playback time by delta * speed
}

const MISSION_START = new Date("2026-04-01T22:35:12Z").getTime();
const MISSION_END_NOMINAL = new Date("2026-04-11T00:17:00Z").getTime();

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  isPlaying: false,
  playbackTime: null,
  playbackSpeed: 100,
  missionStart: MISSION_START,
  missionEnd: Math.min(MISSION_END_NOMINAL, Date.now()),

  play: () => {
    const s = get();
    // If live, start playback from mission start
    if (s.playbackTime === null) {
      set({ isPlaying: true, playbackTime: s.missionStart });
    } else {
      set({ isPlaying: true });
    }
  },

  pause: () => set({ isPlaying: false }),

  setPlaybackTime: (t: number) => {
    const s = get();
    const end = Math.min(MISSION_END_NOMINAL, Date.now());
    const clamped = Math.max(s.missionStart, Math.min(end, t));
    set({ playbackTime: clamped, missionEnd: end });
  },

  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

  goLive: () => set({ playbackTime: null, isPlaying: false }),

  tick: (deltaMs: number) => {
    const s = get();
    if (!s.isPlaying || s.playbackTime === null) return;
    const end = Math.min(MISSION_END_NOMINAL, Date.now());
    const next = s.playbackTime + deltaMs * s.playbackSpeed;
    if (next >= end) {
      set({ playbackTime: end, isPlaying: false, missionEnd: end });
    } else {
      set({ playbackTime: next, missionEnd: end });
    }
  },
}));
