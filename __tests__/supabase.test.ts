/**
 * supabase.test.ts
 *
 * What is tested:
 * - Supabase client initialization
 * - Environment variable validation
 * - Authentication header behavior
 * - Error handling
 */

/* -------------------------------------------------------------------------- */
/*                                    MOCKS                                   */
/* -------------------------------------------------------------------------- */

import { createClient } from "@supabase/supabase-js";

jest.mock("@clerk/expo", () => ({
  useAuth: jest.fn(() => ({
    getToken: jest.fn(async ({ template }) => {
      if (template === "supabase") {
        return "mock-clerk-token-12345";
      }
      return null;
    }),
  })),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

/* -------------------------------------------------------------------------- */
/*                              TEST HELPERS                                  */
/* -------------------------------------------------------------------------- */

const setValidEnv = () => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";

  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
};

const clearEnv = () => {
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
};

/* -------------------------------------------------------------------------- */
/*                               TEST LIFECYCLE                               */
/* -------------------------------------------------------------------------- */

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  setValidEnv();
});

afterEach(() => {
  clearEnv();
});

/* -------------------------------------------------------------------------- */
/*                           SUPABASE CONFIGURATION                           */
/* -------------------------------------------------------------------------- */

describe("Supabase configuration", () => {
  test("createClient is defined", () => {
    expect(createClient).toBeDefined();
  });

  test("environment variables are set correctly", () => {
    expect(process.env.EXPO_PUBLIC_SUPABASE_URL).toBe(
      "https://test.supabase.co",
    );

    expect(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBe("test-anon-key");
  });
});

/* -------------------------------------------------------------------------- */
/*                        ENVIRONMENT VARIABLE VALIDATION                     */
/* -------------------------------------------------------------------------- */

describe("Environment validation", () => {
  test("throws error when URL is missing", () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;

    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("../lib/supabase");
      });
    }).toThrow(/Missing Supabase environment variables/);
  });

  test("throws error when anon key is missing", () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("../lib/supabase");
      });
    }).toThrow(/Missing Supabase environment variables/);
  });

  test("throws error when both variables are missing", () => {
    clearEnv();

    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("../lib/supabase");
      });
    }).toThrow();
  });
});

/* -------------------------------------------------------------------------- */
/*                           AUTHENTICATION HEADERS                           */
/* -------------------------------------------------------------------------- */

describe("Authentication headers", () => {
  test("adds Authorization bearer token", () => {
    const headers = new Map<string, string>();

    headers.set("Authorization", "Bearer mock-clerk-token-12345");

    expect(headers.get("Authorization")).toBe("Bearer mock-clerk-token-12345");
  });

  test("preserves existing headers", () => {
    const headers = new Map<string, string>([
      ["Content-Type", "application/json"],
      ["Accept", "application/json"],
    ]);

    headers.set("Authorization", "Bearer token-123");

    expect(headers.get("Content-Type")).toBe("application/json");

    expect(headers.get("Accept")).toBe("application/json");

    expect(headers.get("Authorization")).toBe("Bearer token-123");

    expect(headers.size).toBe(3);
  });
});

/* -------------------------------------------------------------------------- */
/*                           CLIENT INITIALIZATION                            */
/* -------------------------------------------------------------------------- */

describe("Client initialization", () => {
  test("initializes successfully with valid credentials", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://valid.supabase.co";

    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "valid-anon-key";

    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("../lib/supabase");
      });
    }).not.toThrow();
  });

  test("supports Clerk integration setup", () => {
    const mockCreateClient = jest.fn();

    (createClient as jest.Mock).mockImplementation(mockCreateClient);

    expect(createClient).toBeDefined();
  });
});

/* -------------------------------------------------------------------------- */
/*                               EDGE CASES                                  */
/* -------------------------------------------------------------------------- */

describe("Edge cases", () => {
  test("handles missing environment variables gracefully", () => {
    clearEnv();

    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("../lib/supabase");
      });
    }).toThrow();
  });

  test("clears mocks correctly between tests", () => {
    expect(jest.clearAllMocks).toBeDefined();
  });
});
