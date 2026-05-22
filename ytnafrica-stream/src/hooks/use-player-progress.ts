import { useSyncExternalStore } from 'react';

type ProgressSnapshot = { currentTime: number; duration: number };

let progress: ProgressSnapshot = { currentTime: 0, duration: 0 };
const listeners = new Set<() => void>();
let rafId: number | null = null;

function emit() {
  listeners.forEach((l) => l());
}

/** Batched to animation frames — updates seek bar without re-rendering the whole app */
export function setPlayerProgress(patch: Partial<ProgressSnapshot>) {
  progress = { ...progress, ...patch };
  if (rafId != null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    emit();
  });
}

export function getPlayerProgress(): ProgressSnapshot {
  return progress;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function usePlayerProgress(): ProgressSnapshot {
  return useSyncExternalStore(subscribe, getPlayerProgress, getPlayerProgress);
}
