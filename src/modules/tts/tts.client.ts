import { getBackendCapabilities } from '~/modules/backend/store-backend-capabilities';

import { AudioLivePlayer } from '~/common/util/AudioLivePlayer';
import { CapabilityElevenLabsSpeechSynthesis } from '~/common/components/useCapabilities';
import { frontendSideFetch } from '~/common/util/clientFetchers';
import { playSoundBuffer } from '~/common/util/audioUtils';
import { useUIPreferencesStore } from '~/common/state/store-ui';
import { getTTSData, useTTSData } from './store-module-tts';
import { TTSWire } from './tts.router';

export const isValidLocalAIApiKey = (apiKey?: string) => true; // !!apiKey && apiKey.trim()?.length >= 32;

export const isTTSEnabled = (apiKey?: string) => true; // getBackendCapabilities().hasLlmLocalAIHost;

export function useCapability(): CapabilityElevenLabsSpeechSynthesis {
  const [clientApiKey, voiceId] = useTTSData();
  const isConfiguredServerSide = getBackendCapabilities().hasLlmLocalAIHost;
  const isConfiguredClientSide = true; //clientApiKey ? isValidLocalAIApiKey(clientApiKey) : false;
  const mayWork = isConfiguredServerSide || isConfiguredClientSide || !!voiceId;
  return { mayWork, isConfiguredServerSide, isConfiguredClientSide };
}

export function useIsTTSEnabled() {
  const { mayWork } = useCapability();
  return mayWork;
}

export async function speakText(text: string, voiceId?: string, edge = false) {
  if (!text?.trim()) return;

  const { TTSApiKey, TTSVoiceId } = getTTSData();

  const { preferredLanguage } = useUIPreferencesStore.getState();
  const nonEnglish = !preferredLanguage?.toLowerCase()?.startsWith('en');

  try {
    const edgeResponse = await frontendFetchAPITTSSpeech(text, voiceId || TTSVoiceId, true);
    const audioBuffer = await edgeResponse.arrayBuffer();
    await playSoundBuffer(audioBuffer);
  } catch (error) {
    console.error('Error playing first text:', error);
  }
}

// let liveAudioPlayer: LiveAudioPlayer | undefined = undefined;

export async function EXPERIMENTAL_speakTextStream(text: string, voiceId?: string) {
  if (!text?.trim()) return;

  const { TTSApiKey, TTSVoiceId } = getTTSData();
  if (!isTTSEnabled(TTSApiKey)) return;

  const { preferredLanguage } = useUIPreferencesStore.getState();
  const nonEnglish = !preferredLanguage?.toLowerCase()?.startsWith('en');

  try {
    const edgeResponse = await frontendFetchAPITTSSpeech(text, voiceId || TTSVoiceId, true);

    // if (!liveAudioPlayer)
    const liveAudioPlayer = new AudioLivePlayer();
    // fire/forget
    void liveAudioPlayer.EXPERIMENTAL_playStream(edgeResponse);
  } catch (error) {
    // has happened once in months of testing, not sure what was the cause
    console.error('EXPERIMENTAL_speakTextStream:', error);
  }
}

/**
 * Note: we have to use this client-side API instead of TRPC because of ArrayBuffers..
 */
async function frontendFetchAPITTSSpeech(text: string, model: string, edge = false): Promise<Response> {
  // NOTE: hardcoded 1000 as a failsafe, since the API will take very long and consume lots of credits for longer texts
  const speechInput: TTSWire.TTSRequest = {
    input: text.slice(0, 1000),
    model,
  };
  const response = await frontendSideFetch(edge ? '/api/edge-tts/speech' : `/api/tts/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(speechInput),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || errorData.message || 'Unknown error');
  }

  return response;
}
