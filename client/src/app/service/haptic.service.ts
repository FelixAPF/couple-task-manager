import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HapticService {
  async light(): Promise<void> {
    try {
      if ((window as any).Capacitor?.isPluginAvailable('Haptics')) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (navigator.vibrate) {
        navigator.vibrate(15);
      }
    } catch {}
  }

  async medium(): Promise<void> {
    try {
      if ((window as any).Capacitor?.isPluginAvailable('Haptics')) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (navigator.vibrate) {
        navigator.vibrate(35);
      }
    } catch {}
  }

  async heavy(): Promise<void> {
    try {
      if ((window as any).Capacitor?.isPluginAvailable('Haptics')) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (navigator.vibrate) {
        navigator.vibrate([40, 30, 80]);
      }
    } catch {}
  }
}