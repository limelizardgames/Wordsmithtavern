import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

/** Full-screen game chrome; phones are locked to portrait, tablets may rotate. */
export async function setupNativeChrome(): Promise<void> {
  if (!isNative) return;
  try {
    await StatusBar.hide();
  } catch {
    /* not supported everywhere */
  }
  try {
    const shortest = Math.min(window.screen.width, window.screen.height);
    if (shortest < 600) await ScreenOrientation.lock({ orientation: 'portrait' });
  } catch {
    /* orientation lock unsupported */
  }
}

export async function hideSplash(): Promise<void> {
  if (!isNative) return;
  try {
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch {
    /* already hidden */
  }
}

/** Calls `handler(active)` when the app goes to the background or comes back. */
export function onAppActiveChange(handler: (active: boolean) => void): void {
  document.addEventListener('visibilitychange', () =>
    handler(document.visibilityState === 'visible'),
  );
  if (isNative) {
    void App.addListener('pause', () => handler(false));
    void App.addListener('resume', () => handler(true));
  }
}

/** Android hardware back button. The handler returns false to let the app go to the background. */
export function onBackButton(handler: () => boolean): void {
  if (!isNative) return;
  void App.addListener('backButton', () => {
    if (!handler()) void App.minimizeApp();
  });
}
