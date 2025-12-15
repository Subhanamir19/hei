import create from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthState {
  userId: string | null;
  onboardingCompleted: boolean;
  setUser: (userId: string) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  hydrate: () => Promise<void>;
}

const USER_ID_KEY = 'auth_user_id';
const ONBOARDING_KEY = 'auth_onboarding_completed';

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  onboardingCompleted: false,
  setUser: async (userId: string) => {
    await AsyncStorage.setItem(USER_ID_KEY, userId);
    set({ userId });
  },
  setOnboardingCompleted: async (completed: boolean) => {
    await AsyncStorage.setItem(ONBOARDING_KEY, completed ? '1' : '0');
    set({ onboardingCompleted: completed });
  },
  hydrate: async () => {
    await AsyncStorage.multiRemove([USER_ID_KEY, ONBOARDING_KEY]);
    set({
      userId: null,
      onboardingCompleted: false,
    });
  },
}));
