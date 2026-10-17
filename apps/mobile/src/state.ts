import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
type Job = { id: string; kind: string; payload: Record<string, unknown> };
interface State {
  onboarded: boolean;
  language: string;
  name: string;
  village: string;
  area: string;
  role: string;
  crop: string;
  autoRead: boolean;
  whatsappOptIn: boolean;
  whatsappOptInAt: string | null;
  benchmarkOptIn: boolean;
  outbox: Job[];
  setProfile: (p: Partial<Omit<State, 'setProfile' | 'queue'>>) => void;
  queue: (kind: string, payload: Record<string, unknown>) => void;
}
export const useFarm = create<State>()(
  persist(
    (set) => ({
      onboarded: false,
      language: 'hi',
      name: '',
      village: '',
      area: '',
      role: 'farmer',
      crop: 'tomato',
      autoRead: true,
      whatsappOptIn: false,
      whatsappOptInAt: null,
      benchmarkOptIn: false,
      outbox: [],
      setProfile: (p) => set(p),
      queue: (kind, payload) =>
        set((s) => ({
          outbox: [
            ...s.outbox,
            { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, kind, payload },
          ],
        })),
    }),
    { name: 'khet-native-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
