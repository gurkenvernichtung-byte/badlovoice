package com.badlovoice.app;

import android.content.Context;
import android.webkit.JavascriptInterface;

/**
 * Exposed to the page as window.BadloNative (see MainActivity).
 * JS: BadloNative.startBackgroundAudio() / BadloNative.stopBackgroundAudio()
 */
public class BackgroundAudioBridge {

    private final Context context;

    public BackgroundAudioBridge(Context context) {
        this.context = context.getApplicationContext();
    }

    @JavascriptInterface
    public void startBackgroundAudio() {
        try {
            BackgroundAudioService.start(context);
        } catch (Exception e) {
            // Android may refuse a microphone service started from the background.
        }
    }

    @JavascriptInterface
    public void stopBackgroundAudio() {
        BackgroundAudioService.stop(context);
    }
}
