import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

let enabled = true;
const native = Capacitor.isNativePlatform();

export function setHapticsEnabled(on: boolean) {
  enabled = on;
}

function run(fn: () => Promise<void>) {
  if (!enabled || !native) return;
  fn().catch(() => {
    /* haptics are best-effort */
  });
}

export const haptics = {
  tick: () => run(() => Haptics.selectionChanged()),
  tap: () => run(() => Haptics.impact({ style: ImpactStyle.Light })),
  thud: () => run(() => Haptics.impact({ style: ImpactStyle.Medium })),
  success: () => run(() => Haptics.notification({ type: NotificationType.Success })),
  warning: () => run(() => Haptics.notification({ type: NotificationType.Warning })),
  error: () => run(() => Haptics.notification({ type: NotificationType.Error })),
};
