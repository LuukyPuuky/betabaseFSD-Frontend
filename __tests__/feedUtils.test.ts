import { formatDuration } from "../lib/format";
import { NOTE_COLORS, colorForUserId } from "../lib/noteColors";
import { findNoteCrossedAt } from "../lib/noteTiming";

describe("formatDuration", () => {
  test("formats seconds as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(7)).toBe("0:07");
    expect(formatDuration(37)).toBe("0:37");
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(143)).toBe("2:23");
  });

  test("floors fractional seconds", () => {
    expect(formatDuration(37.9)).toBe("0:37");
  });

  test("guards against invalid input", () => {
    expect(formatDuration(NaN)).toBe("0:00");
    expect(formatDuration(-5)).toBe("0:00");
    expect(formatDuration(Infinity)).toBe("0:00");
  });
});

describe("colorForUserId", () => {
  test("always returns a color from the palette", () => {
    for (const id of ["a", "user-123", "xyz", "", "🧗"]) {
      expect(NOTE_COLORS).toContain(colorForUserId(id));
    }
  });

  test("is deterministic for the same id", () => {
    expect(colorForUserId("user-123")).toBe(colorForUserId("user-123"));
  });

  test("falls back to the first color for empty / nullish ids", () => {
    expect(colorForUserId("")).toBe(NOTE_COLORS[0]);
    expect(colorForUserId(null)).toBe(NOTE_COLORS[0]);
    expect(colorForUserId(undefined)).toBe(NOTE_COLORS[0]);
  });

  test("distinguishes at least some different users", () => {
    const colors = new Set(
      ["aaaa", "aaab", "aaac", "aaad", "aaae", "aaaf"].map(colorForUserId),
    );
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe("findNoteCrossedAt", () => {
  const notes = [
    { id: "a", timestamp_seconds: 10 },
    { id: "b", timestamp_seconds: 20 },
    { id: "c", timestamp_seconds: 30 },
  ];

  test("returns the note crossed during forward playback", () => {
    expect(findNoteCrossedAt(notes, 9.8, 10.1)?.id).toBe("a");
    expect(findNoteCrossedAt(notes, 19.9, 20.2)?.id).toBe("b");
  });

  test("returns null when no note is in the interval", () => {
    expect(findNoteCrossedAt(notes, 11, 12)).toBeNull();
  });

  test("ignores backward seeks", () => {
    expect(findNoteCrossedAt(notes, 25, 10)).toBeNull();
  });

  test("ignores large jumps (seeks) bigger than the max", () => {
    // 0 -> 25 would otherwise cross both 10 and 20.
    expect(findNoteCrossedAt(notes, 0, 25)).toBeNull();
  });

  test("picks the earliest note when several fall in the window", () => {
    expect(findNoteCrossedAt(notes, 9.5, 20.5, 100)?.id).toBe("a");
  });

  test("includes the right edge, excludes the left edge", () => {
    expect(findNoteCrossedAt(notes, 10, 10.5)).toBeNull(); // left edge excluded
    expect(findNoteCrossedAt(notes, 9.5, 10)?.id).toBe("a"); // right edge included
  });
});
