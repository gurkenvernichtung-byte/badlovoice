/**
 * Keeps the voice changer alive while the app is in the background.
 * Native side: BackgroundAudioService (foreground service, type microphone).
 * In the browser the plugin does not exist, so these calls do nothing.
 */

function plugin() {
  try {
    return window.Capacitor?.Plugins?.BackgroundAudio ?? null;
  } catch {
    return null;
  }
}

export function startBackgroundAudio() {
  const p = plugin();
  if (!p?.start) return;
  p.start().catch((err) => console.warn('Background audio not started:', err));
}

export function stopBackgroundAudio() {
  const p = plugin();
  if (!p?.stop) return;
  p.stop().catch(() => {});
}
