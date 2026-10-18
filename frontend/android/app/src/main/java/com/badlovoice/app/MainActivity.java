package com.badlovoice.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BackgroundAudioPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onPause() {
        super.onPause();
        // WebView pauses JS timers when the activity goes to the background. While the
        // voice changer runs (foreground service active), keep them going so the audio
        // pipeline keeps feeding the processed signal.
        if (BackgroundAudioService.running && getBridge() != null) {
            getBridge().getWebView().resumeTimers();
        }
    }
}
