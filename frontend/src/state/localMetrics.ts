import create from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocalMetricsState {
  waterMl: number;
  setWater: (value: number) => Promise<void>;
  hydrate: () => Promise<void>;
}

const WATER_KEY = 'local_water_ml';

export const useLocalMetricsStore = create<LocalMetricsState>((set) => ({
  waterMl: 0,
  setWater: async (value: number) => {
    set({ waterMl: value });
    await AsyncStorage.setItem(WATER_KEY, String(value));
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(WATER_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        set({ waterMl: parsed });
      }
    }
  },
}));
