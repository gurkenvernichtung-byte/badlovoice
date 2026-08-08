import React from 'react';
import {
  DEFAULT_HOST_HZ,
  VOICE_PROFILES,
  describeShift,
} from '../lib/voiceProfiles';

const GROUPS = ['Adult', 'Teen', 'Child', 'Fun'];

export default function VoiceProfiles({ activeId, onSelect, hasModel }) {
  const host = DEFAULT_HOST_HZ;

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="panel-kicker">Voices</p>
          <h2 className="panel-title">Pick a voice</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Tap a preset, then Start. Works offline for pitch. Use Models for AI voices.
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs ${
            hasModel
              ? 'border-[#ff7a45]/40 text-[#ff9a6e]'
              : 'border-white/10 text-zinc-500'
          }`}
        >
          {hasModel ? 'AI model on' : 'Pitch only'}
        </span>
      </div>

      <div className="mt-5 space-y-5">
        {GROUPS.map((group) => {
          const items = VOICE_PROFILES.filter((p) => p.group === group);
          return (
            <div key={group}>
              <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {group}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {items.map((profile) => {
                  const on = activeId === profile.id;
                  const shift = describeShift(host, profile);
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => onSelect(profile)}
                      className={`min-h-[3.25rem] rounded-2xl border px-3 py-3 text-left transition ${
                        on
                          ? 'border-[#ff7a45] bg-[#ff7a45]/15 text-[#f4f0ea]'
                          : 'border-white/10 bg-black/25 text-zinc-300 hover:border-white/25 hover:text-zinc-100'
                      }`}
                    >
                      <span className="block text-base font-semibold tracking-tight">
                        {profile.name}
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500">{profile.blurb}</span>
                      <span className="mt-2 block font-mono text-[10px] text-[#7a9297]">
                        {shift.pitch > 0 ? '+' : ''}
                        {shift.pitch} st
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
