import React, { useCallback, useEffect, useState } from 'react';
import { activateSlot, bindSlot, fetchModels, fetchSlots } from '../lib/api';

export default function SlotBay({ activeModel, onActiveModelChange, modelsRefreshKey = 0 }) {
  const [slots, setSlots] = useState([]);
  const [models, setModels] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const reload = useCallback(async () => {
    try {
      const [slotList, modelList] = await Promise.all([fetchSlots(), fetchModels()]);
      setSlots(slotList || []);
      setModels(modelList || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Could not load slots');
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload, modelsRefreshKey, activeModel]);

  const onBind = async (index, name) => {
    setBusy(`bind-${index}`);
    try {
      await bindSlot(index, name || null);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const onActivate = async (index) => {
    setBusy(`act-${index}`);
    try {
      const result = await activateSlot(index);
      onActiveModelChange?.(result?.name || result?.model || slots[index]?.name);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="panel p-4">
      <p className="panel-kicker">Quick slots</p>
      <h2 className="panel-title">Model slots</h2>
      <p className="mt-1 text-sm text-[color:var(--muted)]">
        Optional shortcuts: bind up to five voice files here for one-click swap.
        (Inspired by w-okada voice-changer — you can ignore this and use the list below.)
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        {slots.map((slot) => (
          <div
            key={slot.index}
            className={`rounded border p-2 ${
              slot.active ? 'border-[#c4783a] bg-[#c4783a]/10' : 'border-[color:var(--line)] bg-[color:var(--surface-2)]/60'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--muted)]">
                {slot.label || `Slot ${slot.index + 1}`}
              </span>
              {slot.active ? (
                <span className="rounded bg-[#6ee7b7] px-1 py-0.5 font-mono text-[9px] text-[#071416]">
                  ON
                </span>
              ) : null}
            </div>
            <select
              className="native-select-safe mt-2 w-full rounded border border-[color:var(--line)] bg-[color:var(--surface-2)] px-1 py-1 text-xs text-[color:var(--ink-text)]"
              value={slot.name || ''}
              disabled={busy != null}
              onChange={(e) => onBind(slot.index, e.target.value)}
            >
              <option value="">Empty</option>
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="chip-button mt-2 w-full"
              disabled={!slot.name || busy != null}
              onClick={() => onActivate(slot.index)}
            >
              Load
            </button>
          </div>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
