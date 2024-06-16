import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

interface ModuleTTSStore {
  // ElevenLabs Text to Speech settings

  TTSApiKey: string;
  setTTSApiKey: (apiKey: string) => void;

  TTSVoiceId: string;
  setTTSVoiceId: (voiceId: string) => void;
}

const useTTSStore = create<ModuleTTSStore>()(
  persist(
    (set) => ({
      // ElevenLabs Text to Speech settings

      TTSApiKey: '',
      setTTSApiKey: (TTSApiKey: string) => set({ TTSApiKey }),

      TTSVoiceId: '',
      setTTSVoiceId: (TTSVoiceId: string) => set({ TTSVoiceId }),
    }),
    {
      name: 'app-module-tts',
    },
  ),
);

export const useTTSApiKey = (): [string, (apiKey: string) => void] => useTTSStore((state) => [state.TTSApiKey, state.setTTSApiKey], shallow);

export const useTTSVoiceId = (): [string, (voiceId: string) => void] => useTTSStore((state) => [state.TTSVoiceId, state.setTTSVoiceId], shallow);

export const useTTSData = (): [string, string] => useTTSStore((state) => [state.TTSApiKey, state.TTSVoiceId], shallow);

export const getTTSData = (): { TTSApiKey: string; TTSVoiceId: string } => useTTSStore.getState();
