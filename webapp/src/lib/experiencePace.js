import { useEffect, useState } from 'react';

// 體驗節奏 - one setting for every scenario. 快速 plays every timed beat of a
// story (a message arriving, a typing indicator, a pause before the next line,
// an automatic step) at FAST_PACE_MULTIPLIER of its normal length: 1.5x, the
// speed the venue asked for (it was 1.82x for 假檢警 alone, and too fast).
// Nothing is skipped - the same lines, choices and endings, sooner. Videos
// play at their own speed, and the time a player has to answer is not touched.
//
// The pace is the venue's, not the run's: staff set it once in
// 工作人員管理模式 and it survives every run's reset and an app restart.
export const FAST_PACE_MULTIPLIER = 2 / 3;

const PACE_KEY = 'cibar-experience-pace';
// Where 假檢警's own pace lived before every scenario shared it: a device set to
// 快速 there stays fast.
const LEGACY_PACE_KEY = 'cibar-scenario03-pace';

const listeners = new Set();
let cachedPace = null;

export function getPace() {
  if (cachedPace) return cachedPace;
  try {
    const stored = localStorage.getItem(PACE_KEY) ?? localStorage.getItem(LEGACY_PACE_KEY);
    cachedPace = stored === 'fast' ? 'fast' : 'normal';
  } catch {
    // Storage unavailable (private mode, WebView with storage off): the venue's
    // choice cannot be remembered, so the safe default.
    cachedPace = 'normal';
  }
  return cachedPace;
}

export function setPace(pace) {
  const next = pace === 'fast' ? 'fast' : 'normal';
  cachedPace = next;
  try {
    localStorage.setItem(PACE_KEY, next);
  } catch {
    // Still applied for this session through `cachedPace`.
  }
  listeners.forEach((fn) => fn(next));
}

/** The multiplier for a beat's length now: 1, or FAST_PACE_MULTIPLIER. */
export function paceMultiplier() {
  return getPace() === 'fast' ? FAST_PACE_MULTIPLIER : 1;
}

/** A story beat's length in ms at the venue's pace. */
export function paced(ms) {
  return Math.round(ms * paceMultiplier());
}

export function usePace() {
  const [pace, setLocal] = useState(getPace);
  useEffect(() => {
    const fn = (next) => setLocal(next);
    listeners.add(fn);
    setLocal(getPace());
    return () => listeners.delete(fn);
  }, []);
  return pace;
}

export function usePaceMultiplier() {
  return usePace() === 'fast' ? FAST_PACE_MULTIPLIER : 1;
}

/** Test seam: forget the cached pace so the next read goes to storage. */
export function resetPaceCacheForTests() {
  cachedPace = null;
}
