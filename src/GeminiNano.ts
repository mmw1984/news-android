import { NativeModules, DeviceEventEmitter, EmitterSubscription } from 'react-native';
import type { GeminiStatus, DownloadEvent } from './types';

const { GeminiNano } = NativeModules as {
  GeminiNano?: {
    checkAvailability: () => Promise<string>;
    downloadModel: () => Promise<null>;
    summarizeText: (text: string) => Promise<string>;
  };
};

export async function checkAvailability(): Promise<GeminiStatus> {
  if (!GeminiNano) return 'UNAVAILABLE';
  try {
    const status = await GeminiNano.checkAvailability();
    return status as GeminiStatus;
  } catch {
    return 'ERROR';
  }
}

export async function downloadModel(): Promise<void> {
  if (!GeminiNano) throw new Error('GeminiNano not available');
  await GeminiNano.downloadModel();
}

export async function summarizeText(text: string): Promise<string> {
  if (!GeminiNano) throw new Error('GeminiNano not available');
  return GeminiNano.summarizeText(text);
}

export function subscribeToDownloadEvents(
  callback: (event: DownloadEvent) => void,
): EmitterSubscription {
  return DeviceEventEmitter.addListener('GeminiModelDownload', callback);
}
