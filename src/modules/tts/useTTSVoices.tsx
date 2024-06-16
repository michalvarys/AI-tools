import * as React from 'react';

import { CircularProgress, Option, Select } from '@mui/joy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RecordVoiceOverTwoToneIcon from '@mui/icons-material/RecordVoiceOverTwoTone';

import { apiQuery } from '~/common/util/trpc.client';

import { playSoundUrl } from '~/common/util/audioUtils';

import { VoiceSchema } from './tts.router';
import { isTTSEnabled } from './tts.client';
import { useTTSVoiceId, useTTSApiKey } from './store-module-tts';
import { useSourceSetup } from '../llms/vendors/useSourceSetup';
import { ModelVendorLocalAI } from '../llms/vendors/localai/localai.vendor';

function VoicesDropdown(props: {
  isValidKey: boolean;
  isLoadingVoices: boolean;
  isErrorVoices: boolean;
  disabled?: boolean;
  voices: VoiceSchema[];
  voiceId: string | null;
  setVoiceId: (voiceId: string) => void;
}) {
  const handleVoiceChange = (_event: any, value: string | null) => props.setVoiceId(value || '');

  return (
    <Select
      value={props.voiceId}
      onChange={handleVoiceChange}
      variant="outlined"
      disabled={props.disabled || !props.voices.length}
      // color={props.isErrorVoices ? 'danger' : undefined}
      placeholder={props.isErrorVoices ? 'Issue loading voices' : props.isValidKey ? 'Select a voice' : 'Missing API Key'}
      startDecorator={<RecordVoiceOverTwoToneIcon />}
      endDecorator={props.isValidKey && props.isLoadingVoices && <CircularProgress size="sm" />}
      indicator={<KeyboardArrowDownIcon />}
      slotProps={{
        root: { sx: { width: '100%' } },
        indicator: { sx: { opacity: 0.5 } },
      }}
    >
      {props.voices.map((voice) => (
        <Option key={voice.id} value={voice.id}>
          {voice.name}
        </Option>
      ))}
    </Select>
  );
}

export function useTTSVoices() {
  const [ttsKey] = useTTSApiKey();

  const isConfigured = isTTSEnabled(ttsKey);
  const { data, isLoading, isError } = apiQuery.tts.listVoices.useQuery(
    { ttsKey },
    {
      enabled: isConfigured,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  );

  const voices = data?.voices || [];
  return {
    isConfigured,
    isLoading,
    isError,
    hasVoices: !isLoading && !!voices.length,
    voices,
  };
}

export function useTTSVoicesDropdown(autoSpeak: boolean, disabled?: boolean) {
  // external state
  const { isConfigured, isLoading, isError, hasVoices, voices } = useTTSVoices();
  const [voiceId, setVoiceId] = useTTSVoiceId();

  // derived state
  const voice: VoiceSchema | undefined = voices.find((voice) => voice.id === voiceId);

  // [E] autoSpeak
  const previewUrl = (autoSpeak && voice?.previewUrl) || null;
  React.useEffect(() => {
    if (previewUrl) playSoundUrl(previewUrl);
  }, [previewUrl]);

  const voicesDropdown = React.useMemo(
    () => (
      <VoicesDropdown
        isValidKey={isConfigured}
        isLoadingVoices={isLoading}
        isErrorVoices={isError}
        disabled={disabled}
        voices={voices}
        voiceId={voiceId}
        setVoiceId={setVoiceId}
      />
    ),
    [disabled, isConfigured, isError, isLoading, setVoiceId, voiceId, voices],
  );

  return {
    hasVoices,
    voiceId,
    voiceName: voice?.name,
    voicesDropdown,
  };
}
