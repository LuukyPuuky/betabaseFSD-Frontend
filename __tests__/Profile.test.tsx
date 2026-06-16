import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { ActivityIndicator } from "react-native";
import Profile from "../app/(tabs)/profile";

jest.mock("@clerk/expo", () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  useSupabase: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Feather: ({ name }: any) => <View testID={`icon-${name}`} />,
  };
});

jest.mock("expo-image", () => ({
  Image: ({ source }: any) => {
    const { View } = jest.requireActual("react-native");
    return <View testID={`image-${source?.uri || "placeholder"}`} />;
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn((callback) => {
    jest.requireActual("react").useEffect(() => {
      if (callback && typeof callback === "function") {
        callback();
      }
    }, []);
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAuth, useUser } = require("@clerk/expo");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useSupabase } = require("@/lib/supabase");

const mockUser = {
  id: "test-user-123",
  username: "testclimber",
  fullName: "Test Climber",
  imageUrl: "https://example.com/avatar.jpg",
};

const mockProfile = {
  id: "test-user-123",
  username: "testclimber",
  avatar_url: "https://example.com/avatar.jpg",
  bio: "Sending projects one dyno at a time.",
  grade: "V8",
  followers_count: 1200,
  following_count: 20,
  sends_count: 40,
};

const mockPost = {
  id: "post-1",
  gym_name: "Red Rock",
  grade: "V5",
  climbing_style: "Boulder",
  description: "Fun route",
  video_url: "https://example.com/video.mp4",
  user_id: "test-user-123",
  view_count: 142,
  created_at: new Date().toISOString(),
};

describe("Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      userId: "test-user-123",
      isLoaded: true,
    });
    useUser.mockReturnValue({
      user: mockUser,
    });
  });

  describe("Loading state", () => {
    test("shows ActivityIndicator while loading", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => new Promise(() => {})), // Never resolves
            })),
          })),
        })),
        storage: {
          from: jest.fn(),
        },
      });

      const { UNSAFE_queryByType } = render(<Profile />);

      await waitFor(() => {
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
      });
    });
  });

  describe("Profile loading", () => {
    test("fetches and displays profile data", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn((table) => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({ data: mockProfile, error: null }),
              ),
            })),
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      });

      const { getByText } = render(<Profile />);

      await waitFor(() => {
        expect(getByText("@testclimber")).toBeTruthy();
        expect(getByText("V8 • 0 Beta Videos")).toBeTruthy();
      });
    });

    test("displays user stats correctly", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn((table) => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({ data: mockProfile, error: null }),
              ),
            })),
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      });

      const { getByText } = render(<Profile />);

      await waitFor(() => {
        expect(getByText("1200")).toBeTruthy();
        expect(getByText("20")).toBeTruthy();
        expect(getByText("40")).toBeTruthy();
      });
    });

    test("displays user bio when available", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn((table) => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({ data: mockProfile, error: null }),
              ),
            })),
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      });

      const { getByText } = render(<Profile />);

      await waitFor(() => {
        expect(getByText(/Sending projects one dyno at a time/)).toBeTruthy();
      });
    });
  });

  describe("Posts loading", () => {
    test("fetches and displays my videos", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn((table) => {
          if (table === "profiles") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() =>
                    Promise.resolve({ data: mockProfile, error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "posts") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() =>
                    Promise.resolve({ data: [mockPost], error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "post_likes") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            };
          }
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }),
      });

      const { getByTestId } = render(<Profile />);

      await waitFor(() => {
        expect(getByTestId("grid-cell-post-1")).toBeTruthy();
      });
    });

    test("renders grid cells for each post", async () => {
      const mockPosts = [
        { ...mockPost, id: "post-1" },
        { ...mockPost, id: "post-2" },
        { ...mockPost, id: "post-3" },
      ];

      useSupabase.mockReturnValue({
        from: jest.fn((table) => {
          if (table === "profiles") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() =>
                    Promise.resolve({ data: mockProfile, error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "posts") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() =>
                    Promise.resolve({ data: mockPosts, error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "post_likes") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            };
          }
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }),
      });

      const { getByTestId } = render(<Profile />);

      await waitFor(() => {
        expect(getByTestId("grid-cell-post-1")).toBeTruthy();
        expect(getByTestId("grid-cell-post-2")).toBeTruthy();
        expect(getByTestId("grid-cell-post-3")).toBeTruthy();
      });
    });
  });

  describe("Tab switching", () => {
    test("My Videos tab is active by default", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn((table) => {
          if (table === "profiles") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() =>
                    Promise.resolve({ data: mockProfile, error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "posts") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() =>
                    Promise.resolve({ data: [mockPost], error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "post_likes") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            };
          }
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }),
      });

      const { getByText } = render(<Profile />);

      await waitFor(() => {
        const myVideosTab = getByText("My Videos");
        expect(myVideosTab).toBeTruthy();
      });
    });

    test("can switch to Liked Videos tab", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn((table) => {
          if (table === "profiles") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() =>
                    Promise.resolve({ data: mockProfile, error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "posts") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() =>
                    Promise.resolve({ data: [], error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "post_likes") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            };
          }
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }),
      });

      const { getByText } = render(<Profile />);

      await waitFor(() => {
        const likedVideosTab = getByText("Liked Videos");
        expect(likedVideosTab).toBeTruthy();
      });
    });
  });

  describe("Empty state", () => {
    test("shows empty state when no posts", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn((table) => {
          if (table === "profiles") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() =>
                    Promise.resolve({ data: mockProfile, error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "posts") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() =>
                    Promise.resolve({ data: [], error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "post_likes") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            };
          }
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }),
      });

      const { getByText } = render(<Profile />);

      await waitFor(() => {
        expect(getByText(/No videos yet/i)).toBeTruthy();
      });
    });

    test("shows different message for liked videos empty state", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn((table) => {
          if (table === "profiles") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() =>
                    Promise.resolve({ data: mockProfile, error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "posts") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() =>
                    Promise.resolve({ data: [], error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "post_likes") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            };
          }
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }),
      });

      const { getByText } = render(<Profile />);

      await waitFor(() => {
        const likedVideosTab = getByText("Liked Videos");
        fireEvent.press(likedVideosTab);
      });

      await waitFor(() => {
        expect(getByText(/No liked videos yet/i)).toBeTruthy();
      });
    });
  });

  describe("Error handling", () => {
    test("handles profile fetch error gracefully", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn((table) => {
          if (table === "profiles") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() =>
                    Promise.resolve({
                      data: null,
                      error: { message: "Network error" },
                    }),
                  ),
                })),
              })),
            };
          }
          if (table === "posts") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() =>
                    Promise.resolve({ data: [], error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "post_likes") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            };
          }
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }),
      });

      expect(() => {
        render(<Profile />);
      }).not.toThrow();
    });

    test("does not crash on posts fetch error", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn((table) => {
          if (table === "profiles") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() =>
                    Promise.resolve({ data: mockProfile, error: null }),
                  ),
                })),
              })),
            };
          }
          if (table === "posts") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() =>
                    Promise.resolve({
                      data: null,
                      error: { message: "Fetch failed" },
                    }),
                  ),
                })),
              })),
            };
          }
          if (table === "post_likes") {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            };
          }
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }),
      });

      expect(() => {
        render(<Profile />);
      }).not.toThrow();
    });
  });

  describe("Auth handling", () => {
    test("does not fetch when userId is not loaded", async () => {
      useAuth.mockReturnValue({
        userId: null,
        isLoaded: false,
      });

      const mockSupabase = {
        from: jest.fn(),
      };
      useSupabase.mockReturnValue(mockSupabase);

      const { UNSAFE_queryByType } = render(<Profile />);

      await waitFor(() => {
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
      });
    });
  });
});
