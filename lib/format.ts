/**
 * Format a duration in seconds as "m:ss" (e.g. 37 -> "0:37", 143 -> "2:23").
 * Guards against NaN / negative / non-finite input so it can be fed raw
 * `player.currentTime` / `player.duration` values from expo-video before the
 * media has loaded.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
