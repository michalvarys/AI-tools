import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc.server';
import { env } from '~/server/env.mjs';
import { fetchJsonOrTRPCError } from '~/server/api/trpc.router.fetchers';
import { innerVoices } from './voice';

export const speechInputSchema = z.object({
  ttsKey: z.string().optional(),
  input: z.string(),
  model: z.string().optional(),
});

export type SpeechInputSchema = z.infer<typeof speechInputSchema>;

const listVoicesInputSchema = z.object({
  ttsKey: z.string().optional(),
});

const voiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  previewUrl: z.string().nullable(),
  category: z.string(),
  default: z.boolean(),
});

export type VoiceSchema = z.infer<typeof voiceSchema>;

const listVoicesOutputSchema = z.object({
  voices: z.array(voiceSchema),
});

export const ttsRouter = createTRPCRouter({
  /**
   * List Voices available to this api key
   */
  listVoices: publicProcedure
    .input(listVoicesInputSchema)
    .output(listVoicesOutputSchema)
    .query(async ({ input }) => {
      // const { ttsKey } = input;
      // const { headers, url } = ttsAccess(ttsKey, '/v1/models');

      // const voicesList = await fetchJsonOrTRPCError<{ data: TTSWire.VoicesList['voices'] }>(url, 'GET', headers, undefined, 'LocalAI');
      // const voices = voicesList.data
      //   .filter((voice) => voice.id.startsWith('voice-en-us-') && !voice.id.endsWith('.gz'))
      //   .map((voice, index) => ({
      //     id: voice.id,
      //     name: voice.id,
      //     description: '',
      //     previewUrl: '',
      //     category: '',
      //     default: voice.id === 'voice-en-us-ryan-medium',
      //   }));

      return {
        voices: innerVoices.map((voice) => ({
          id: voice,
          name: voice,
          description: '',
          previewUrl: '',
          category: '',
          default: voice === 'en-US-ChristopherNeural',
        })),
      };
    }),

  /**
   * Text to Speech: NOTE: we cannot use this until tRPC will support ArrayBuffers
   * So for the speech synthesis, we unfortunately have to use the NextJS API route,
   * but at least we recycle the data types and helpers.
   */
  /*speech: publicProcedure
    .input(speechInputSchema)
    .mutation(async ({ input }) => {

      const { elevenKey, text, voiceId: _voiceId, nonEnglish } = input;
      const { headers, url } = elevenlabsAccess(elevenKey, `/v1/text-to-speech/${elevenlabsVoiceId(_voiceId)}`);
      const body: ElevenlabsWire.TTSRequest = {
        text: text,
        ...(nonEnglish && { model_id: 'eleven_multilingual_v2' }),
      };

      const response = await fetchBufferOrTRPCError(url, headers, method: 'POST', body: JSON.stringify(body), ... });
      await rethrowElevenLabsError(response);
      return await response.arrayBuffer();
    }),*/
});

export function ttsAccess(localAIKEy: string | undefined, apiPath: string): { headers: HeadersInit; url: string } {
  // API key
  localAIKEy = (localAIKEy || env.LOCALAI_API_KEY || '').trim();
  //   if (!localAIKEy) throw new Error('Missing ElevenLabs API key.');

  // API host
  let host = (env.LOCALAI_API_HOST || 'http://localhost:8080').trim();
  if (!host.startsWith('http')) host = `https://${host}`;
  if (host.endsWith('/') && apiPath.startsWith('/')) host = host.slice(0, -1);

  return {
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': localAIKEy,
      Authorization: `Bearer ${localAIKEy}`,
    },
    url: host + apiPath,
  };
}

export function TTSVoiceId(voiceId?: string): string {
  return voiceId?.trim() || env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
}

/// This is the upstream API [rev-eng on 2023-04-12]
export namespace TTSWire {
  export interface TTSRequest {
    input: string;
    model?: 'voice-en-us-ryan-medium' | string;
  }

  export type VoicesList = { voices: Model[] };

  interface Model {
    id: string;
    object: string;
  }
}
