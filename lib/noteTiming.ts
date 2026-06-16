type TimedNote = {
  timestamp_seconds: number;
};

/**
 * Find the note whose timestamp playback just crossed during forward playback,
 * i.e. whose `timestamp_seconds` lies in the half-open interval
 * `(prevTime, currentTime]`. Used to auto-reveal a note's bubble as the video
 * reaches it.
 *
 * Returns `null` when nothing was crossed, when the time moved backward (a seek
 * / loop), or when the jump is too large to be normal playback (avoids firing
 * every note at once after a big seek). When several notes fall in the window,
 * the earliest crossed note is returned.
 */
export function findNoteCrossedAt<T extends TimedNote>(
  notes: T[],
  prevTime: number,
  currentTime: number,
  maxJumpSeconds = 1.5,
): T | null {
  if (
    !Number.isFinite(prevTime) ||
    !Number.isFinite(currentTime) ||
    currentTime <= prevTime ||
    currentTime - prevTime > maxJumpSeconds
  ) {
    return null;
  }

  let crossed: T | null = null;
  for (const note of notes) {
    const t = note.timestamp_seconds;
    if (t > prevTime && t <= currentTime) {
      if (crossed === null || t < crossed.timestamp_seconds) {
        crossed = note;
      }
    }
  }

  return crossed;
}
