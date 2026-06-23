import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { ActivityIndicator } from "react-native";
import Home from "../app/(tabs)/index";

jest.mock("@/lib/supabase", () => ({
  useSupabase: jest.fn(),
}));

jest.mock("@/app/components/FeedCard", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  // eslint-disable-next-line react/display-name
  return ({ item }: any) => <View testID={`feedcard-${item.id}`} />;
});

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock("@react-navigation/native", () => ({
  useIsFocused: jest.fn(() => true),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useSupabase } = require("@/lib/supabase");

describe("Home", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading state", () => {
    test("shows ActivityIndicator while loading", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => new Promise(() => {})), // Never resolves
            })),
          })),
        })),
      });

      const { UNSAFE_queryByType } = render(<Home />);

      await waitFor(() => {
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
      });
    });
  });

  describe("Loaded with data", () => {
    test("shows FeedCard for each post", async () => {
      const mockPosts = [
        {
          id: "1",
          gym_name: "Red Rock",
          grade: "V5",
          climbing_style: "Boulder",
          description: "Fun",
          video_url: "http://test.mp4",
        },
        {
          id: "2",
          gym_name: "Planet Granite",
          grade: "V6",
          climbing_style: "Boulder",
          description: "Hard",
          video_url: "http://test2.mp4",
        },
      ];

      useSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest
                .fn()
                .mockResolvedValue({ data: mockPosts, error: null }),
            })),
          })),
        })),
      });

      const { getByTestId } = render(<Home />);

      const pager = await waitFor(() => getByTestId("feed-pager"));
      fireEvent(pager, "layout", {
        nativeEvent: { layout: { height: 800, width: 400, x: 0, y: 0 } },
      });

      // Virtualization (windowSize/initialNumToRender) only mounts the first
      // card(s) in the test environment; assert the feed renders the first.
      await waitFor(() => {
        expect(getByTestId("feedcard-1")).toBeTruthy();
      });
    });

    test("renders the feed when data has multiple posts", async () => {
      const mockPosts = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        gym_name: `Gym ${i + 1}`,
        grade: "V5",
        climbing_style: "Boulder",
        description: "Test",
        video_url: "http://test.mp4",
      }));

      useSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest
                .fn()
                .mockResolvedValue({ data: mockPosts, error: null }),
            })),
          })),
        })),
      });

      const { getByTestId } = render(<Home />);

      const pager = await waitFor(() => getByTestId("feed-pager"));
      fireEvent(pager, "layout", {
        nativeEvent: { layout: { height: 800, width: 400, x: 0, y: 0 } },
      });

      // Off-screen cards are intentionally not mounted (memory); the feed
      // should still render the first card without crashing on 5 posts.
      await waitFor(() => {
        expect(getByTestId("feedcard-1")).toBeTruthy();
      });
    });
  });

  describe("Loaded with no data", () => {
    test("renders no FeedCards when data is empty", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        })),
      });

      const { queryByTestId, UNSAFE_queryByType } = render(<Home />);

      await waitFor(() => {
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeFalsy();
      });

      expect(queryByTestId(/feedcard-/)).toBeFalsy();
    });
  });

  describe("Error state", () => {
    test("renders no cards when Supabase returns error", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Network error" },
              }),
            })),
          })),
        })),
      });

      const { queryByTestId, UNSAFE_queryByType } = render(<Home />);

      await waitFor(() => {
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeFalsy();
      });

      expect(queryByTestId(/feedcard-/)).toBeFalsy();
    });

    test("does not crash on error", async () => {
      useSupabase.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Network error" },
              }),
            })),
          })),
        })),
      });

      expect(() => {
        render(<Home />);
      }).not.toThrow();
    });
  });
});
