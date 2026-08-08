/**
 * Pitch / formant voice presets for DSP (and Android APK).
 * Pitch = 12 * log2(targetHz / hostHz); host defaults to DEFAULT_HOST_HZ.
 */

export const VOICE_PROFILES = [
  // Adult
  {
    id: 'male',
    name: 'Male',
    group: 'Adult',
    blurb: 'Young adult man',
    targetHz: 120,
    formantBias: -0.5,
    eq: { enabled: true, low: 2, high: -1 },
  },
  {
    id: 'female',
    name: 'Female',
    group: 'Adult',
    blurb: 'Young adult woman',
    targetHz: 210,
    formantBias: 0.5,
    eq: { enabled: true, low: -1, high: 3 },
  },
  {
    id: 'mid-man',
    name: 'Mid-age man',
    group: 'Adult',
    blurb: 'Deeper, warmer man',
    targetHz: 105,
    formantBias: -1,
    eq: { enabled: true, low: 4, high: -3 },
  },
  {
    id: 'mid-woman',
    name: 'Mid-age woman',
    group: 'Adult',
    blurb: 'Mature woman tone',
    targetHz: 185,
    formantBias: 0.2,
    eq: { enabled: true, low: 1, high: 1 },
  },
  {
    id: 'deep',
    name: 'Deeper',
    group: 'Adult',
    blurb: 'Extra deep chest voice',
    targetHz: 90,
    formantBias: -1.5,
    eq: { enabled: true, low: 5, high: -4 },
  },
  {
    id: 'bright-female',
    name: 'Bright female',
    group: 'Adult',
    blurb: 'Airy higher woman',
    targetHz: 240,
    formantBias: 0.8,
    eq: { enabled: true, low: -2, high: 5 },
  },
  // Teen / Child
  {
    id: 'teen-boy',
    name: 'Teen boy',
    group: 'Teen',
    blurb: 'Teenage boy',
    targetHz: 165,
    formantBias: 0,
    eq: { enabled: true, low: 0, high: 1 },
  },
  {
    id: 'teen-girl',
    name: 'Teen girl',
    group: 'Teen',
    blurb: 'Teenage girl',
    targetHz: 230,
    formantBias: 0.6,
    eq: { enabled: true, low: -1, high: 4 },
  },
  {
    id: 'boy',
    name: 'Boy',
    group: 'Child',
    blurb: 'Young boy',
    targetHz: 280,
    formantBias: 1,
    eq: { enabled: true, low: -2, high: 5 },
  },
  {
    id: 'girl',
    name: 'Girl',
    group: 'Child',
    blurb: 'Young girl',
    targetHz: 310,
    formantBias: 1.4,
    eq: { enabled: true, low: -3, high: 6 },
  },
  // Fun / FX (great on Android)
  {
    id: 'giant',
    name: 'Giant',
    group: 'Fun',
    blurb: 'Very deep giant',
    targetHz: 75,
    formantBias: -2,
    eq: { enabled: true, low: 6, high: -5 },
    robot: false,
  },
  {
    id: 'chipmunk',
    name: 'Chipmunk',
    group: 'Fun',
    blurb: 'Helium / squeaky',
    targetHz: 360,
    formantBias: 2,
    eq: { enabled: true, low: -4, high: 7 },
  },
  {
    id: 'helium',
    name: 'Helium',
    group: 'Fun',
    blurb: 'Party balloon voice',
    targetHz: 320,
    formantBias: 1.8,
    eq: { enabled: true, low: -3, high: 6 },
  },
  {
    id: 'monster',
    name: 'Monster',
    group: 'Fun',
    blurb: 'Dark creature growl',
    targetHz: 85,
    formantBias: -2.2,
    eq: { enabled: true, low: 5, high: -6 },
    robot: { enabled: true, freq: 55 },
  },
  {
    id: 'robot',
    name: 'Robot',
    group: 'Fun',
    blurb: 'Metallic ring-mod',
    targetHz: 140,
    formantBias: -0.2,
    eq: { enabled: true, low: 0, high: 2 },
    robot: { enabled: true, freq: 90 },
  },
  {
    id: 'radio',
    name: 'Radio',
    group: 'Fun',
    blurb: 'Walkie-talkie vibe',
    targetHz: 130,
    formantBias: 0,
    eq: { enabled: true, low: -2, high: 4 },
    telephone: true,
  },
  {
    id: 'whisper-high',
    name: 'Soft high',
    group: 'Fun',
    blurb: 'Soft raised tone',
    targetHz: 250,
    formantBias: 1,
    eq: { enabled: true, low: -4, high: 5 },
    whisper: true,
  },
  {
    id: 'villain',
    name: 'Villain',
    group: 'Fun',
    blurb: 'Movie bad-guy deep',
    targetHz: 95,
    formantBias: -1.8,
    eq: { enabled: true, low: 4, high: -4 },
  },
];

/** Featured presets for Simple home (tap-first). */
export const FEATURED_PROFILE_IDS = [
  'deep',
  'bright-female',
  'whisper-high',
  'chipmunk',
  'monster',
  'robot',
  'giant',
  'villain',
];

/** Assumed host F0 for DSP profile shifts (typical adult male). */
export const DEFAULT_HOST_HZ = 120;

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** Semitone shift from host F0 toward profile target F0. */
export function pitchFromHost(hostHz, targetHz) {
  const h = Math.max(60, Number(hostHz) || DEFAULT_HOST_HZ);
  const t = Math.max(60, Number(targetHz) || h);
  const semis = 12 * Math.log2(t / h);
  return Math.round(clamp(semis, -16, 16) * 10) / 10;
}

export function formantFromPitch(pitchSemis, bias = 0) {
  return Math.round(clamp(pitchSemis * 0.65 + bias, -8, 8) * 10) / 10;
}

export function profileToVoicePartial(profile, hostHz = DEFAULT_HOST_HZ) {
  const pitch = pitchFromHost(hostHz, profile.targetHz);
  const formant = formantFromPitch(pitch, profile.formantBias || 0);
  return { pitch, formant };
}

export function profileToEffects(profile, baseEffects) {
  const next = { ...(baseEffects || {}) };
  next.robot = profile.robot
    ? { enabled: true, freq: profile.robot.freq || 90 }
    : { enabled: false, freq: 90 };
  next.bitcrush = { ...(next.bitcrush || {}), enabled: false };
  next.telephone = {
    ...(next.telephone || { enabled: false }),
    enabled: Boolean(profile.telephone),
  };
  next.whisper = {
    ...(next.whisper || { enabled: false }),
    enabled: Boolean(profile.whisper),
  };
  if (profile.eq) next.eq = { ...profile.eq };
  return next;
}

export function describeShift(hostHz, profile) {
  const partial = profileToVoicePartial(profile, hostHz);
  return {
    ...partial,
    hostHz,
    targetHz: profile.targetHz,
  };
}
