// Pure level-curve logic — no DB dependency.
// Level thresholds:
//   L1→L2: 100  L2→L3: 150  L3→L4: 220  L4→L5: 300  L5+: prev+100

import type { LevelInfo } from "./types";

/**
 * Returns the XP required to advance FROM level `level` TO `level + 1`.
 * Level is 1-based. Level 5+ follows the +100 pattern.
 */
export function xpRequiredForLevel(level: number): number {
  if (level === 1) return 100;
  if (level === 2) return 150;
  if (level === 3) return 220;
  if (level === 4) return 300;
  // level 5+ : 300 + 100*(level-4)
  return 300 + 100 * (level - 4);
}

/**
 * Computes full level info from a raw totalXp value.
 * Returns the current level, XP within this level, XP needed for next level,
 * and a 0–1 progress ratio.
 */
export function computeLevel(totalXp: number): LevelInfo {
  if (totalXp < 0) totalXp = 0;

  let level = 1;
  let remaining = totalXp;

  while (true) {
    const needed = xpRequiredForLevel(level);
    if (remaining < needed) {
      return {
        level,
        currentLevelXp: remaining,
        xpToNextLevel: needed,
        progress: needed > 0 ? remaining / needed : 1,
      };
    }
    remaining -= needed;
    level += 1;
  }
}
