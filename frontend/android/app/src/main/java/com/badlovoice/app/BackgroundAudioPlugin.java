package com.badlovoice.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * JS bridge: window.Capacitor.Plugins.BackgroundAudio.start() / .stop()
 * Called from useAudioPipeline when the voice changer starts or stops.
 */
@CapacitorPlugin(name = "BackgroundAudio")
public class BackgroundAudioPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        try {
            BackgroundAudioService.start(getContext());
            call.resolve();
        } catch (Exception e) {
            // Android may refuse starting a microphone service from the background.
            call.reject("Background audio could not start: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        BackgroundAudioService.stop(getContext());
        call.resolve();
    }
}
