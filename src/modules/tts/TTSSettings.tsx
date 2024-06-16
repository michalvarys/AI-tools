import * as React from 'react';

import { FormControl } from '@mui/joy';

import { AlreadySet } from '~/common/components/AlreadySet';
import { FormInputKey } from '~/common/components/forms/FormInputKey';
import { FormLabelStart } from '~/common/components/forms/FormLabelStart';
import { useCapabilityElevenLabs } from '~/common/components/useCapabilities';

import { isTTSEnabled } from './tts.client';
import { useTTSVoicesDropdown } from './useTTSVoices';
import { useTTSApiKey } from './store-module-tts';

export function TTSSettings() {
  // external state
  const [apiKey, setApiKey] = useTTSApiKey();
  const { isConfiguredServerSide } = useCapabilityElevenLabs();
  const { voicesDropdown } = useTTSVoicesDropdown(true);

  // derived state
  const isValidKey = isTTSEnabled(apiKey);

  return (
    <>
      {/*<FormHelperText>*/}
      {/*  📢 Hear AI responses, even in your own voice*/}
      {/*</FormHelperText>*/}

      {!isConfiguredServerSide && (
        <FormInputKey
          autoCompleteId="localai-key"
          label="LocalAI API Key"
          rightLabel={<AlreadySet required={!isConfiguredServerSide} />}
          value={apiKey}
          onChange={setApiKey}
          required={!isConfiguredServerSide}
          isError={!isValidKey}
        />
      )}

      <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <FormLabelStart title="Assistant Voice" />
        {voicesDropdown}
      </FormControl>
    </>
  );
}
