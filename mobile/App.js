import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { WebView } from 'react-native-webview';

/** Live DSP site (no backend required for pitch). Override with EXPO_PUBLIC_APP_URL. */
const APP_URL =
  process.env.EXPO_PUBLIC_APP_URL?.trim() || 'https://badlovoice.vercel.app';

export default function App() {
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permDenied, setPermDenied] = useState(false);

  const askMic = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermDenied(true);
        return false;
      }
      setPermDenied(false);
      return true;
    } catch (err) {
      setError(err?.message || 'Could not request microphone permission');
      return false;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await askMic();
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [askMic]);

  const source = useMemo(() => ({ uri: APP_URL }), []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.brand}>BadloVoice</Text>
        <Text style={styles.sub} numberOfLines={1}>
          Expo · {APP_URL.replace(/^https?:\/\//, '')}
        </Text>
        <Pressable
          style={styles.reload}
          onPress={() => {
            setError(null);
            setLoading(true);
            webRef.current?.reload();
          }}
        >
          <Text style={styles.reloadText}>Reload</Text>
        </Pressable>
      </View>

      {permDenied && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Mic permission is off. Enable it in system settings, then Reload.
          </Text>
          <Pressable onPress={askMic}>
            <Text style={styles.bannerAction}>Ask again</Text>
          </Pressable>
        </View>
      )}

      {error && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      )}

      <View style={styles.webWrap}>
        {ready ? (
          <WebView
            ref={webRef}
            source={source}
            style={styles.web}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(e) => {
              setLoading(false);
              setError(e.nativeEvent?.description || 'Failed to load BadloVoice');
            }}
            onHttpError={(e) => {
              if (e.nativeEvent?.statusCode >= 400) {
                setError(`Site error ${e.nativeEvent.statusCode}`);
              }
            }}
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            allowsFullscreenVideo={false}
            setSupportMultipleWindows={false}
            originWhitelist={['*']}
            mixedContentMode="always"
            // Auto-allow getUserMedia prompts inside the WebView (iOS).
            mediaCapturePermissionGrantType="grant"
            applicationNameForUserAgent="BadloVoiceExpo"
          />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#e05528" />
            <Text style={styles.hint}>Preparing microphone…</Text>
          </View>
        )}

        {loading && ready && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#e05528" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#efe4d4',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(42,35,28,0.14)',
    backgroundColor: '#f7f0e6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2a231c',
  },
  sub: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(42,35,28,0.55)',
  },
  reload: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(224,85,40,0.45)',
    backgroundColor: 'rgba(224,85,40,0.12)',
  },
  reloadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c4471f',
  },
  banner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(224,85,40,0.12)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(224,85,40,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    color: '#2a231c',
  },
  bannerAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c4471f',
  },
  webWrap: {
    flex: 1,
    backgroundColor: '#efe4d4',
  },
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  hint: {
    fontSize: 13,
    color: 'rgba(42,35,28,0.55)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,228,212,0.55)',
  },
});
