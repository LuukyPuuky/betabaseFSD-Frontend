/**
 * Data Validation Tests
 */

/* -------------------------------------------------------------------------- */
/*                              SHARED VALIDATORS                             */
/* -------------------------------------------------------------------------- */

const VALID_STYLES = ["Boulder", "TopRope", "Sport", "Trad", "Speed"];

/* ------------------------- V-GRADE VALIDATION ------------------------- */

const validateVGrade = (grade: string | number) => {
  const str = String(grade).toUpperCase();
  const match = str.match(/^V(\d+)$/);

  if (!match) return false;

  const num = parseInt(match[1], 10);
  return num >= 0 && num <= 17;
};

const validateNumericGrade = (grade: number) => grade >= 0 && grade <= 17;

/* ---------------------- CLIMBING STYLE VALIDATION --------------------- */

const validateClimbingStyle = (style: string) => VALID_STYLES.includes(style);

/* ------------------------ VIDEO URL VALIDATION ------------------------ */

const validateVideoUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

/* ------------------------- GYM NAME VALIDATION ------------------------ */

const validateGymName = (name: string) => {
  return !!name && name.trim().length >= 2 && name.trim().length <= 100;
};

/* ---------------------- DESCRIPTION VALIDATION ------------------------ */

const validateDescription = (desc: string) => {
  return !!desc && desc.trim().length >= 5 && desc.trim().length <= 500;
};

/* -------------------------------------------------------------------------- */
/*                        CLIMBING GRADE VALIDATION                          */
/* -------------------------------------------------------------------------- */

describe("Climbing Grade Validation", () => {
  test("should accept valid V-grades", () => {
    const validGrades = ["V0", "V1", "V5", "V10", "V17"];

    validGrades.forEach((g) => {
      expect(validateVGrade(g)).toBe(true);
    });
  });

  test("should reject invalid V-grades", () => {
    const invalidGrades = ["V-1", "V18", "A5", "V", "V1a"];

    invalidGrades.forEach((g) => {
      expect(validateVGrade(g)).toBe(false);
    });
  });

  test("should accept numeric grades", () => {
    [0, 1, 5, 10, 17].forEach((g) => {
      expect(validateNumericGrade(g)).toBe(true);
    });
  });

  test("should reject out-of-range grades", () => {
    expect(validateNumericGrade(-1)).toBe(false);
    expect(validateNumericGrade(100)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*                        CLIMBING STYLE VALIDATION                          */
/* -------------------------------------------------------------------------- */

describe("Climbing Style Validation", () => {
  test("should accept valid styles", () => {
    VALID_STYLES.forEach((style) => {
      expect(validateClimbingStyle(style)).toBe(true);
    });
  });

  test("should reject invalid styles", () => {
    ["Bouldering", "Rope", "", "unknown"].forEach((style) => {
      expect(validateClimbingStyle(style)).toBe(false);
    });
  });

  test("should be case sensitive", () => {
    expect(validateClimbingStyle("Boulder")).toBe(true);
    expect(validateClimbingStyle("boulder")).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*                           VIDEO URL VALIDATION                             */
/* -------------------------------------------------------------------------- */

describe("Video URL Validation", () => {
  test("should accept valid URLs", () => {
    [
      "https://example.com/video.mp4",
      "https://videos.example.com/v1.mp4",
    ].forEach((url) => {
      expect(validateVideoUrl(url)).toBe(true);
    });
  });

  test("should reject invalid URLs", () => {
    ["not-a-url", "ftp://example.com/video.mp4", ""].forEach((url) => {
      expect(validateVideoUrl(url)).toBe(false);
    });
  });

  test("should handle query parameters", () => {
    expect(validateVideoUrl("https://example.com/video.mp4?token=123")).toBe(
      true,
    );
  });
});

/* -------------------------------------------------------------------------- */
/*                           GYM NAME VALIDATION                              */
/* -------------------------------------------------------------------------- */

describe("Gym Name Validation", () => {
  test("should accept valid names", () => {
    ["Red Rock Canyon", "Planet Granite", "O'Reilly's Gym"].forEach((name) => {
      expect(validateGymName(name)).toBe(true);
    });
  });

  test("should reject invalid names", () => {
    expect(validateGymName("")).toBe(false);
    expect(validateGymName("A")).toBe(false);
  });

  test("should reject too long names", () => {
    const long = "A".repeat(101);
    expect(validateGymName(long)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*                        DESCRIPTION VALIDATION                              */
/* -------------------------------------------------------------------------- */

describe("Description Validation", () => {
  test("should accept valid descriptions", () => {
    expect(validateDescription("Climbing V5 problems")).toBe(true);
  });

  test("should reject invalid descriptions", () => {
    expect(validateDescription("")).toBe(false);
    expect(validateDescription("Hi")).toBe(false);
  });

  test("should reject too long descriptions", () => {
    const long = "A".repeat(501);
    expect(validateDescription(long)).toBe(false);
  });

  test("should support multiline text", () => {
    expect(validateDescription("Line1\nLine2")).toBe(true);
  });
});
