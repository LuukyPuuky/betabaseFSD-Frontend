import { render } from "@testing-library/react-native";
import React from "react";
import Chat from "../app/(tabs)/chat";
import Friends from "../app/(tabs)/friends";
import Profile from "../app/(tabs)/profile";

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock("@clerk/expo", () => ({
  useAuth: jest.fn(() => ({ userId: "test-user", isLoaded: true })),
  useUser: jest.fn(() => ({
    user: {
      username: "testuser",
      fullName: "Test User",
      imageUrl: null,
    },
  })),
}));

jest.mock("@/lib/supabase", () => ({
  useSupabase: jest.fn(() => ({
    from: jest.fn((table) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: {
                id: "test-user",
                username: "testuser",
                avatar_url: null,
                bio: null,
                grade: "Beginner",
                followers_count: 0,
                following_count: 0,
                sends_count: 0,
              },
              error: null,
            }),
          ),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
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

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn((callback) => {
    jest.requireActual("react").useEffect(() => {
      if (callback && typeof callback === "function") {
        callback();
      }
    }, []);
  }),
}));

describe("Stub Screens", () => {
  describe("Chat", () => {
    test("renders without crashing", () => {
      expect(() => {
        render(<Chat />);
      }).not.toThrow();
    });

    test("renders Chat text", () => {
      const { getByText } = render(<Chat />);
      expect(getByText("Chat")).toBeTruthy();
    });
  });

  describe("Friends", () => {
    test("renders without crashing", () => {
      expect(() => {
        render(<Friends />);
      }).not.toThrow();
    });

    test("renders Friends text", () => {
      const { getByText } = render(<Friends />);
      expect(getByText("Friends")).toBeTruthy();
    });
  });

  describe("Profile", () => {
    test("renders without crashing", async () => {
      expect(() => {
        render(<Profile />);
      }).not.toThrow();
    });
  });
});
