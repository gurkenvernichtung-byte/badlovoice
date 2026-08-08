import { useCallback, useRef, useState } from 'react';
import { SAMPLE_RATE, CHUNK_SIZE } from '../lib/constants';
import { encodeWav } from '../lib/wav';

export default function useAudioPipeline(wsHook) {
  const [isRunning, setIsRunning] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [lastRecording, setLastRecording] = useState(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateLevelDb, setGateLevelDb] = useState(-80);

  const audioContextRef = useRef(null);
  const captureSinkRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const gateNodeRef = useRef(null);
  const captureNodeRef = useRef(null);
  const playbackNodeRef = useRef(null);
  const playbackGainRef = useRef(null);
  const monitorNodeRef = useRef(null);
  const monitorGainRef = useRef(null);
  const inputAnalyserRef = useRef(null);
  const outputAnalyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const seqNumRef = useRef(0);
  const recordingRef = useRef(false);
  const recordChunksRef = useRef([]);
  const recordSamplesRef = useRef(0);
  const sampleRateRef = useRef(SAMPLE_RATE);
  const monitorParamsRef = useRef({ pitch: 7, robot: 0, robotFreq: 90, enabled: true });
  const gateParamsRef = useRef({ enabled: false, thresholdDb: -56, holdMs: 280 });
  const recordDestRef = useRef(null);
  const recordProcessorRef = useRef(null);

  const rmsToMeter = (rms) => {
    // Map ~-50 dB..0 dB → 0..100 so meters actually move when you talk.
    const db = 20 * Math.log10(Math.max(rms, 1e-6));
    return Math.max(0, Math.min(100, ((db + 50) / 50) * 100));
  };

  const updateLevels = useCallback(() => {
    if (inputAnalyserRef.current) {
      const data = new Float32Array(inputAnalyserRef.current.fftSize);
      inputAnalyserRef.current.getFloatTimeDomainData(data);
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
        const a = Math.abs(data[i]);
        if (a > peak) peak = a;
      }
      setInputLevel(rmsToMeter(Math.max(Math.sqrt(sum / data.length), peak * 0.5)));
    }

    if (outputAnalyserRef.current) {
      const data = new Float32Array(outputAnalyserRef.current.fftSize);
      outputAnalyserRef.current.getFloatTimeDomainData(data);
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
        const a = Math.abs(data[i]);
        if (a > peak) peak = a;
      }
      setOutputLevel(rmsToMeter(Math.max(Math.sqrt(sum / data.length), peak * 0.5)));
    }

    if (recordingRef.current) {
      setRecordSeconds(recordSamplesRef.current / sampleRateRef.current);
    }

    animFrameRef.current = requestAnimationFrame(updateLevels);
  }, []);

  const setMonitorParams = useCallback((partial) => {
    monitorParamsRef.current = { ...monitorParamsRef.current, ...partial };
    monitorNodeRef.current?.port.postMessage(monitorParamsRef.current);
  }, []);

  const setGateParams = useCallback((partial) => {
    gateParamsRef.current = { ...gateParamsRef.current, ...partial };
    gateNodeRef.current?.port.postMessage(gateParamsRef.current);
  }, []);

  // local = pitched DSP preview (instant). rvc = hear server model (duck local).
  const setListenMode = useCallback((mode) => {
    const rvc = mode === 'rvc' || mode === 'server';
    const ctx = audioContextRef.current;
    const now = ctx?.currentTime ?? 0;
    if (monitorGainRef.current) {
      monitorGainRef.current.gain.cancelScheduledValues(now);
      // Keep local monitor under ~1.0 so recordings don't hard-clip.
      monitorGainRef.current.gain.setValueAtTime(rvc ? 0.12 : 1.0, now);
    }
    if (playbackGainRef.current) {
      playbackGainRef.current.gain.cancelScheduledValues(now);
      playbackGainRef.current.gain.setValueAtTime(rvc ? 1.8 : 1.0, now);
    }
    if (monitorNodeRef.current) {
      monitorNodeRef.current.port.postMessage({
        ...monitorParamsRef.current,
        enabled: !rvc,
        pitch: rvc ? 0 : monitorParamsRef.current.pitch,
      });
    }
  }, []);

  const start = useCallback(
    async (inputDeviceId, outputDeviceId) => {
      try {
        const audioContext = new AudioContext({
          sampleRate: SAMPLE_RATE,
          latencyHint: 'interactive',
        });
        audioContextRef.current = audioContext;
        const actualRate = audioContext.sampleRate || SAMPLE_RATE;
        sampleRateRef.current = actualRate;
        wsHook.sendSettings?.({
          sample_rate: actualRate,
          chunk_size: CHUNK_SIZE,
        });

        if (outputDeviceId && audioContext.setSinkId) {
          await audioContext.setSinkId(outputDeviceId);
        }

        const constraints = {
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
            sampleRate: actualRate,
            ...(inputDeviceId ? { deviceId: { exact: inputDeviceId } } : {}),
          },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        await audioContext.audioWorklet.addModule('/audioWorklet.js');
        await audioContext.audioWorklet.addModule('/dspMonitorWorklet.js');
        await audioContext.audioWorklet.addModule('/noiseGateWorklet.js');

        const gateNode = new AudioWorkletNode(audioContext, 'noise-gate-processor', {
          outputChannelCount: [1],
        });
        gateNodeRef.current = gateNode;
        gateNode.port.postMessage(gateParamsRef.current);
        gateNode.port.onmessage = (event) => {
          const msg = event.data;
          if (msg?.type === 'gate') {
            setGateOpen(Boolean(msg.open));
            setGateLevelDb(Number(msg.levelDb) || -80);
          }
        };

        const captureNode = new AudioWorkletNode(audioContext, 'capture-processor', {
          processorOptions: { chunkSize: CHUNK_SIZE },
        });
        captureNodeRef.current = captureNode;

        const playbackNode = new AudioWorkletNode(audioContext, 'playback-processor', {
          processorOptions: { chunkSize: CHUNK_SIZE },
          outputChannelCount: [1],
        });
        playbackNodeRef.current = playbackNode;

        const monitorNode = new AudioWorkletNode(audioContext, 'dsp-monitor-processor', {
          outputChannelCount: [1],
        });
        monitorNodeRef.current = monitorNode;
        monitorNode.port.postMessage(monitorParamsRef.current);

        const captureSink = audioContext.createGain();
        captureSink.gain.value = 0;
        captureSinkRef.current = captureSink;

        const playbackGain = audioContext.createGain();
        playbackGainRef.current = playbackGain;

        const monitorGain = audioContext.createGain();
        monitorGainRef.current = monitorGain;

        const mixGain = audioContext.createGain();
        mixGain.gain.value = 1;

        // Smooth peaks before speakers + record (loud talk was brick-wall clipping).
        const limiter = audioContext.createDynamicsCompressor();
        limiter.threshold.value = -12;
        limiter.knee.value = 18;
        limiter.ratio.value = 8;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.18;

        const inputAnalyser = audioContext.createAnalyser();
        inputAnalyser.fftSize = 2048;
        inputAnalyser.smoothingTimeConstant = 0.82;
        inputAnalyserRef.current = inputAnalyser;

        const outputAnalyser = audioContext.createAnalyser();
        outputAnalyser.fftSize = 2048;
        outputAnalyser.smoothingTimeConstant = 0.82;
        outputAnalyserRef.current = outputAnalyser;

        const recordDest = audioContext.createMediaStreamDestination();
        recordDestRef.current = recordDest;

        // Default to DSP preview; App switches to 'rvc' when a module is active.
        monitorGain.gain.value = 1.0;
        playbackGain.gain.value = 1.0;
        monitorNode.port.postMessage({
          ...monitorParamsRef.current,
          enabled: true,
        });

        // Mic → gate → analyser / capture / wet monitor
        source.connect(gateNode);
        gateNode.connect(inputAnalyser);
        inputAnalyser.connect(captureNode);
        captureNode.connect(captureSink);
        captureSink.connect(audioContext.destination);

        gateNode.connect(monitorNode);
        monitorNode.connect(monitorGain);
        monitorGain.connect(mixGain);

        playbackNode.connect(playbackGain);
        playbackGain.connect(mixGain);

        mixGain.connect(limiter);
        limiter.connect(outputAnalyser);
        outputAnalyser.connect(audioContext.destination);
        limiter.connect(recordDest);

        // Reliable WAV capture of what you hear (after limiter).
        const recProc = audioContext.createScriptProcessor(4096, 1, 1);
        recordProcessorRef.current = recProc;
        const recSink = audioContext.createGain();
        recSink.gain.value = 0;
        limiter.connect(recProc);
        recProc.connect(recSink);
        recSink.connect(audioContext.destination);
        recProc.onaudioprocess = (event) => {
          if (!recordingRef.current) return;
          const input = event.inputBuffer.getChannelData(0);
          // Soft-clip copy so a single loud burst can't trash the whole take.
          const copy = new Float32Array(input.length);
          for (let i = 0; i < input.length; i++) {
            copy[i] = Math.tanh(input[i]);
          }
          recordChunksRef.current.push(copy);
          recordSamplesRef.current += copy.length;
        };

        seqNumRef.current = 0;
        captureNode.port.onmessage = (event) => {
          const buffer = event.data;
          if (buffer instanceof Float32Array) {
            wsHook.sendAudio(buffer, seqNumRef.current++);
          }
        };

        wsHook.setOnAudioReceived((pcmData) => {
          if (playbackNodeRef.current) {
            playbackNodeRef.current.port.postMessage(pcmData);
          }
        });

        await audioContext.resume();
        animFrameRef.current = requestAnimationFrame(updateLevels);
        setIsRunning(true);
      } catch (err) {
        console.error('Failed to start audio pipeline:', err);
        stop();
        if (err.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied. Allow mic access and try again.');
        }
        if (err.name === 'NotFoundError') {
          throw new Error('No microphone found.');
        }
        if (err.name === 'NotReadableError') {
          throw new Error('Microphone is in use by another app.');
        }
        throw err;
      }
    },
    [wsHook, updateLevels]
  );

  const finalizeRecording = useCallback(() => {
    recordingRef.current = false;
    setIsRecording(false);

    const chunks = recordChunksRef.current;
    const samples = recordSamplesRef.current;
    recordChunksRef.current = [];
    recordSamplesRef.current = 0;
    setRecordSeconds(0);

    if (!chunks.length || samples < 800) {
      setLastRecording((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return null;
      });
      return null;
    }

    const blob = encodeWav(chunks, sampleRateRef.current);
    const recording = {
      url: URL.createObjectURL(blob),
      seconds: samples / sampleRateRef.current,
      size: blob.size,
      mime: 'audio/wav',
      ext: 'wav',
    };
    setLastRecording((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return recording;
    });
    return recording;
  }, []);

  const startRecording = useCallback(() => {
    if (!isRunning && !audioContextRef.current) {
      throw new Error('Start the voice changer first, then press Record.');
    }
    if (recordingRef.current) return;
    recordChunksRef.current = [];
    recordSamplesRef.current = 0;
    recordingRef.current = true;
    setRecordSeconds(0);
    setIsRecording(true);
  }, [isRunning]);

  const stopRecording = useCallback(() => finalizeRecording(), [finalizeRecording]);

  const discardRecording = useCallback(() => {
    setLastRecording((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const stop = useCallback(() => {
    if (recordingRef.current) {
      finalizeRecording();
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const nodes = [
      sourceRef,
      gateNodeRef,
      captureNodeRef,
      captureSinkRef,
      playbackNodeRef,
      playbackGainRef,
      monitorNodeRef,
      monitorGainRef,
      inputAnalyserRef,
      outputAnalyserRef,
      recordProcessorRef,
    ];
    for (const ref of nodes) {
      try {
        ref.current?.disconnect();
      } catch { /* already disconnected */ }
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close();

    audioContextRef.current = null;
    captureSinkRef.current = null;
    streamRef.current = null;
    sourceRef.current = null;
    gateNodeRef.current = null;
    captureNodeRef.current = null;
    playbackNodeRef.current = null;
    playbackGainRef.current = null;
    monitorNodeRef.current = null;
    monitorGainRef.current = null;
    inputAnalyserRef.current = null;
    outputAnalyserRef.current = null;
    recordDestRef.current = null;
    recordProcessorRef.current = null;

    wsHook.setOnAudioReceived(null);
    setInputLevel(0);
    setOutputLevel(0);
    setGateOpen(false);
    setGateLevelDb(-80);
    setIsRunning(false);
  }, [wsHook, finalizeRecording]);

  const getAnalysers = useCallback(
    () => ({
      input: inputAnalyserRef.current,
      output: outputAnalyserRef.current,
    }),
    []
  );

  return {
    start,
    stop,
    isRunning,
    inputLevel,
    outputLevel,
    getAnalysers,
    isRecording,
    recordSeconds,
    lastRecording,
    startRecording,
    stopRecording,
    discardRecording,
    setMonitorParams,
    setGateParams,
    setListenMode,
    gateOpen,
    gateLevelDb,
  };
}
