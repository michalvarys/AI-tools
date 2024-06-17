import { NextRequest } from 'next/server';

import { createEmptyReadableStream, nonTrpcServerFetchOrThrow, safeErrorString } from '~/server/wire';

import { ttsAccess, TTSVoiceId, TTSWire, speechInputSchema } from './tts.router';
// import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
// import { EdgeTTS } from 'node-edge-tts';
/* NOTE: Why does this file even exist?

This file is a workaround for a limitation in tRPC; it does not support ArrayBuffer responses,
and that would force us to use base64 encoding for the audio data, which would be a waste of
bandwidth. So instead, we use this file to make the request to ElevenLabs, and then return the
response as an ArrayBuffer. Unfortunately this means duplicating the code in the server-side
and client-side vs. the tRPC implementation. So at lease we recycle the input structures.

*/

export async function edgeTTSHandler(req: NextRequest) {
  try {
    // construct the upstream request
    const { input, model = 'cs-CZ-AntoninNeural' } = speechInputSchema.parse(await req.json());
    const voice = 'en-US-ChristopherNeural' //model.startsWith('cs-CZ-') ? model : `cs-CZ-AntoninNeural`;
    const baseUrl = "https://edge-tts.varyshop.eu"
    // elevenlabs POST
    const upstreamResponse: Response = await nonTrpcServerFetchOrThrow(`http://edge-tts:8088/tts?text=${input}&voice=${voice}`, 'GET', {}, undefined);
    const { url } = await upstreamResponse.json();
    const link = `https://edge-tts.varyshop.eu${url}`;
    const buffer = await fetch(link).then((res) => res.arrayBuffer());

    const audioReadableStream = buffer || createEmptyReadableStream();
    return new Response(audioReadableStream, { status: 200, headers: { 'Content-Type': 'audio/mpeg' } });
  } catch (error: any) {
    const fetchOrVendorError = safeErrorString(error) + (error?.cause ? ' · ' + error.cause : '');
    console.log(`api/localai/speech: fetch issue: ${fetchOrVendorError}`);
    return new Response(`[Issue] elevenlabs: ${fetchOrVendorError}`, { status: 500 });
  }
}

export async function TTSHandler(req: NextRequest) {
  try {
    // construct the upstream request
    const { ttsKey, input, model = 'voice-en-us-ryan-medium' } = speechInputSchema.parse(await req.json());
    const path = `/tts`;
    const { headers, url } = ttsAccess(ttsKey, path);
    const body: TTSWire.TTSRequest = {
      input,
      model,
    };

    // elevenlabs POST
    const upstreamResponse: Response = await nonTrpcServerFetchOrThrow(url, 'POST', headers, body);

    // NOTE: this is disabled, as we pass-through what we get upstream for speed, as it is not worthy
    //       to wait for the entire audio to be downloaded before we send it to the client
    // if (!streaming) {
    //   const audioArrayBuffer = await upstreamResponse.arrayBuffer();
    //   return new NextResponse(audioArrayBuffer, { status: 200, headers: { 'Content-Type': 'audio/mpeg' } });
    // }

    // stream the data to the client
    const audioReadableStream = upstreamResponse.body || createEmptyReadableStream();
    return new Response(audioReadableStream, { status: 200, headers: { 'Content-Type': 'audio/mpeg' } });
  } catch (error: any) {
    const fetchOrVendorError = safeErrorString(error) + (error?.cause ? ' · ' + error.cause : '');
    console.log(`api/localai/speech: fetch issue: ${fetchOrVendorError}`);
    return new Response(`[Issue] elevenlabs: ${fetchOrVendorError}`, { status: 500 });
  }
}
