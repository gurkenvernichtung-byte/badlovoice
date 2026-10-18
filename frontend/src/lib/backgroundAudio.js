/**
 * Keeps the voice changer alive while the app is in the background.
 * Native side (Android APK only): window.BadloNative, provided by MainActivity,
 * which starts/stops BackgroundAudioService (foreground service, type microphone).
 * In the browser the object does not exist, so these calls do nothing.
 */

function native() {
  try {
    return window.BadloNative ?? null;
  } catch {
    return null;
  }
}

export function startBackgroundAudio() {
  try {
    native()?.startBackgroundAudio?.();
  } catch (err) {
    console.warn('Background audio not started:', err);
  }
}

export function stopBackgroundAudio() {
  try {
    native()?.stopBackgroundAudio?.();
  } catch {
    // ignore
  }
}
