import React, { useState } from 'react';

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Hands a take to the system share sheet (Files, WhatsApp, Mail, …).
 * Returns 'shared' | 'cancelled' | 'unsupported'.
 */
async function shareTake(take) {
  const file = new File([take.blob], take.name, { type: 'audio/wav' });
  if (!navigator.share || !navigator.canShare?.({ files: [file] })) return 'unsupported';
  try {
    await navigator.share({ files: [file], title: take.name });
    return 'shared';
  } catch (err) {
    if (err?.name === 'AbortError') return 'cancelled';
    throw err;
  }
}

/**
 * Records the mixed output (local pitch monitor + server return).
 * Requires Start first — Record alone does nothing on purpose.
 * Every take stays in the list until deleted: Save, Send or Delete.
 */
export default function Recorder({ pipeline, onEnsureStarted, compact = false }) {
  const { isRunning, isRecording, recordSeconds, recordings = [] } = pipeline;
  const [hint, setHint] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const handleRecord = async () => {
    setHint(null);
    try {
      if (!isRunning) {
        if (!onEnsureStarted) {
          setHint('Tap Start first, then Record.');
          return;
        }
        setHint('Starting…');
        await onEnsureStarted();
      }
      pipeline.startRecording();
      setHint('Recording — talk, then tap Stop.');
    } catch (err) {
      setHint(err.message || 'Could not start recording');
    }
  };

  const handleStop = () => {
    const result = pipeline.stopRecording();
    const report = (rec) =>
      setHint(rec ? 'Take saved to the list below.' : 'Empty take — talk longer, then try again.');
    if (result && typeof result.then === 'function') {
      result.then(report);
      return;
    }
    report(result);
  };

  const handleSave = (take) => {
    // Browser download. In the Android app this may not save — use Send then.
    const link = document.createElement('a');
    link.href = take.url;
    link.download = take.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setHint('Download started. If nothing happens, use Send → Save to Files.');
  };

  const handleSend = async (take) => {
    setHint(null);
    try {
      const outcome = await shareTake(take);
      if (outcome === 'unsupported') {
        setHint('Sending is not available on this device — use Save.');
      }
    } catch (err) {
      setHint(err.message || 'Could not send the take');
    }
  };

  const handleDelete = (id) => {
    pipeline.deleteRecording(id);
    setConfirmId(null);
    setHint('Take deleted.');
  };

  const takes = recordings.length ? (
    <ul className="mt-4 space-y-3">
      {recordings.map((take, index) => (
        <li
          key={take.id}
          className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)]/50 p-3.5"
        >
          <p className="text-xs text-[color:var(--muted)]">
            Take {recordings.length - index} · {formatDuration(take.seconds)} · {formatSize(take.size)}
          </p>
          <audio controls src={take.url} className="mt-2 h-9 w-full" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(take)}
              className="chip-button !normal-case min-h-10"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => handleSend(take)}
              className="chip-button !normal-case min-h-10"
            >
              Send
            </button>
            {confirmId === take.id ? (
              <>
                <button
                  type="button"
                  onClick={() => handleDelete(take.id)}
                  className="btn-secondary-danger min-h-10"
                >
                  Confirm delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  className="chip-button !normal-case min-h-10"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmId(take.id)}
                className="chip-button !normal-case min-h-10"
              >
                Delete
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  ) : null;

  if (compact) {
    return (
      <section className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[color:var(--ink-text)]">Record</p>
          {isRecording ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 font-mono text-sm tabular-nums text-[color:var(--danger-soft)]">
                <span className="rec-blink inline-block h-2.5 w-2.5 rounded-full bg-[color:var(--danger)]" />
                {formatDuration(recordSeconds)}
              </span>
              <button type="button" onClick={handleStop} className="btn-secondary-danger">
                Stop
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleRecord} className="btn-record">
              {isRunning ? 'Record' : 'Start + Record'}
            </button>
          )}
        </div>
        {hint ? (
          <p className="mt-2 text-xs text-[color:var(--accent-soft)]" role="status">
            {hint}
          </p>
        ) : null}
        {takes}
      </section>
    );
  }

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="panel-kicker">Recorder</p>
          <h2 className="panel-title">Capture output</h2>
        </div>

        {isRecording ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 font-mono text-sm tabular-nums text-[color:var(--danger-soft)]">
              <span className="rec-blink inline-block h-2.5 w-2.5 rounded-full bg-[color:var(--danger)]" />
              {formatDuration(recordSeconds)}
            </span>
            <button type="button" onClick={handleStop} className="btn-secondary-danger">
              Stop
            </button>
          </div>
        ) : (
          <button type="button" onClick={handleRecord} className="btn-record">
            {isRunning ? 'Record' : 'Start + Record'}
          </button>
        )}
      </div>

      <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-[color:var(--muted)]">
        <li>Wear headphones</li>
        <li>
          Press <strong className="text-[color:var(--ink-text)]">Start</strong> (or Start + Record)
        </li>
        <li>Talk, then Stop — Save, Send or Delete each take below</li>
      </ol>

      {hint ? (
        <p className="mt-2 text-xs text-[color:var(--accent-soft)]" role="status">
          {hint}
        </p>
      ) : null}
      {takes}
    </section>
  );
}
