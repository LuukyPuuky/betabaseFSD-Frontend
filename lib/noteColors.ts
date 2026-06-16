export const NOTE_COLORS = [
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#EC4899", // pink
  "#14B8A6", // teal
  "#A855F7", // purple
  "#EF4444", // red
] as const;

export type NoteColor = (typeof NOTE_COLORS)[number];

export function colorForUserId(userId: string | null | undefined): NoteColor {
  if (!userId) {
    return NOTE_COLORS[0];
  }

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash + userId.charCodeAt(i)) % NOTE_COLORS.length;
  }

  return NOTE_COLORS[hash];
}
