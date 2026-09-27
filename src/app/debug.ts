import { service } from './service';
import { save, screen } from './state';

/**
 * A tiny read-only window into the game for automated tests and debugging.
 * Enabled in dev builds, or in any build with ?debug in the URL.
 */
export function installDebugHook() {
  const enabled = import.meta.env.DEV || new URLSearchParams(location.search).has('debug');
  if (!enabled) return;
  Object.defineProperty(window, 'wordsmith', {
    configurable: true,
    value: {
      screen: () => screen.value,
      phase: () => service.value?.phase ?? null,
      order: () => service.value?.order ?? null,
      save: () => save.value,
    },
  });
}
