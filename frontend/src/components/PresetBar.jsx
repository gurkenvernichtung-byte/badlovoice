import React, { useCallback, useEffect, useState } from 'react';
import { fetchPresets, savePreset, deletePreset } from '../lib/api';

function PresetChip({ preset, active, onApply, onDelete }) {
  return (
    <div className="group relative flex-shrink-0">
      <button
        onClick={() => onApply(preset)}
        title={preset.description}
        className={`rounded border px-3 py-2 text-sm font-medium transition ${
          active
            ? 'border-emerald-300/50 bg-emerald-400/[0.08] text-emerald-100'
            : 'border-[color:var(--line)] bg-[color:var(--surface-2)]/70 text-[color:var(--muted)] hover:border-[color:var(--ink-text)]/20 hover:text-[color:var(--ink-text)]'
        }`}
      >
        <span className="whitespace-nowrap">{preset.name}</span>
      </button>
      {onDelete && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete(preset);
          }}
          title="Delete preset"
          className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-sm border border-rose-300/40 bg-[#18090d] text-[9px] text-[color:var(--danger-soft)] group-hover:flex"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default function PresetBar({ activePresetId, onApplyPreset, getCurrentSettings }) {
  const [presets, setPresets] = useState({ builtin: [], user: [] });
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchPresets();
      setPresets({
        builtin: Array.isArray(data?.builtin) ? data.builtin : [],
        user: Array.isArray(data?.user) ? data.user : [],
      });
      setError(null);
    } catch {
      setError('Preset service unavailable');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      await savePreset(name, getCurrentSettings());
      setSaveName('');
      setShowSave(false);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save preset');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (preset) => {
    try {
      await deletePreset(preset.id);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to delete preset');
    }
  };

  return (
    <section id="presets" className="panel scroll-mt-20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="panel-kicker">Extra presets</p>
          <h2 className="panel-title">FX & saved</h2>
        </div>

        <div className="flex items-center gap-2">
          {showSave ? (
            <div className="flex items-center gap-2">
              <input
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSave();
                  if (event.key === 'Escape') setShowSave(false);
                }}
                placeholder="Preset name"
                maxLength={40}
                autoFocus
                className="w-40 rounded border border-[color:var(--ink-text)]/20 bg-[color:var(--surface-2)] px-3 py-1.5 text-sm text-[color:var(--ink-text)] outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--ink-text)]/35"
              />
              <button onClick={handleSave} disabled={saving || !saveName.trim()} className="chip-button">
                {saving ? '...' : 'Save'}
              </button>
              <button onClick={() => setShowSave(false)} className="chip-button !px-2.5">
                ✕
              </button>
            </div>
          ) : (
            <button onClick={() => setShowSave(true)} className="chip-button">
              + Save current
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-[color:var(--danger)]">{error}</p>}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 pt-2">
        {presets.builtin.map((preset) => (
          <PresetChip
            key={preset.id}
            preset={preset}
            active={activePresetId === preset.id}
            onApply={onApplyPreset}
          />
        ))}
        {presets.user.length > 0 && <div className="mx-1 w-px flex-shrink-0 self-stretch bg-white/10" />}
        {presets.user.map((preset) => (
          <PresetChip
            key={preset.id}
            preset={preset}
            active={activePresetId === preset.id}
            onApply={onApplyPreset}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </section>
  );
}
