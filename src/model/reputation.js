import { BASE } from './schema.js';

export function clampView(value) {
  const clamped = Math.max(1, Math.min(100, value));
  return clamped;
}

export function sumDelta(state, fromId, toId) {
  const total = state.transactions
    .filter((tx) => tx.fromId === fromId && tx.toId === toId)
    .reduce((acc, tx) => acc + tx.delta, 0);
  return total;
}

export function computeScore(state, fromId, toId) {
  const raw = BASE + sumDelta(state, fromId, toId);
  const score = clampView(raw);
  return score;
}
