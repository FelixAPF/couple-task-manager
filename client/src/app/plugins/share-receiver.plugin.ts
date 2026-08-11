// src/app/plugins/share-receiver.plugin.ts

import { registerPlugin } from '@capacitor/core';

export interface SharedVideoEvent {
  path: string; // absolute local filesystem path on the device
}

export interface ShareReceiverPlugin {
  getPendingVideo(): Promise<{ path: string | null }>;
  addListener(
    eventName: 'sharedVideoReceived',
    listenerFunc: (data: SharedVideoEvent) => void
  ): Promise<any>;
}

const ShareReceiver = registerPlugin<ShareReceiverPlugin>('ShareReceiver');

export default ShareReceiver;
