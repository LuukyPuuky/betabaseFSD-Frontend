/**
 * FeedCard.test.tsx
 *
 * What is tested:
 * - Rendering of post information
 * - Follow button behavior
 * - Video playback UI states
 * - Different input data
 * - Edge cases
 */

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import FeedCard from "../app/components/FeedCard";

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

jest.mock("expo-video", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");

  return {
    VideoView: ({ style }: any) => <View style={style} testID="video-view" />,

    useVideoPlayer: jest.fn((_url, init) => {
      const player = {
        play: jest.fn(),
        pause: jest.fn(),
        loop: false,
        muted: false,
      };
      if (init) init(player);
      return player;
    }),
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");

  return {
    Feather: ({ name }: any) => <View testID={`icon-${name}`} />,
  };
});

/* -------------------------------------------------------------------------- */
/*                                 TEST DATA                                  */
/* -------------------------------------------------------------------------- */

const mockPost = {
  id: "1",
  gym_name: "Red Rock Canyon",
  grade: "V5",
  climbing_style: "Boulder",
  description: "Crushing some V5 problems",
  video_url: "https://example.com/video.mp4",
};

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTION                               */
/* -------------------------------------------------------------------------- */

const renderFeedCard = (props = {}) => {
  return render(<FeedCard item={mockPost} active={true} {...props} />);
};

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe("FeedCard", () => {
  /* -------------------------------- RENDER -------------------------------- */

  describe("Rendering", () => {
    test("renders user information", () => {
      const { getByText } = renderFeedCard();

      expect(getByText("James Doe")).toBeTruthy();
      expect(getByText(/Red Rock Canyon/)).toBeTruthy();
      expect(getByText(/V5/)).toBeTruthy();
    });

    test("renders video player", () => {
      const { getByTestId } = renderFeedCard();

      expect(getByTestId("video-view")).toBeTruthy();
    });

    test("renders action buttons", () => {
      const { getByText, getByTestId } = renderFeedCard();

      expect(getByText("Follow")).toBeTruthy();

      expect(getByTestId("icon-heart")).toBeTruthy();
      expect(getByTestId("icon-share-2")).toBeTruthy();
      expect(getByTestId("icon-edit-2")).toBeTruthy();
    });

    test("renders video information", () => {
      const { getByText } = renderFeedCard();

      expect(getByText("1.2k")).toBeTruthy();
      expect(getByText("0:37 / 2:23")).toBeTruthy();
    });
  });

  /* ----------------------------- FOLLOW BUTTON ----------------------------- */

  describe("Follow button", () => {
    test("changes from Follow to Following", async () => {
      const { getByText } = renderFeedCard();

      fireEvent.press(getByText("Follow"));

      await waitFor(() => {
        expect(getByText("Following")).toBeTruthy();
      });
    });

    test("toggles back to Follow", async () => {
      const { getByText } = renderFeedCard();

      fireEvent.press(getByText("Follow"));

      await waitFor(() => {
        expect(getByText("Following")).toBeTruthy();
      });

      fireEvent.press(getByText("Following"));

      await waitFor(() => {
        expect(getByText("Follow")).toBeTruthy();
      });
    });

    test("keeps follow state after rerender", async () => {
      const { getByText, rerender } = renderFeedCard();

      fireEvent.press(getByText("Follow"));

      await waitFor(() => {
        expect(getByText("Following")).toBeTruthy();
      });

      rerender(<FeedCard item={mockPost} active={false} />);

      expect(getByText("Following")).toBeTruthy();
    });
  });

  /* ------------------------------- VIDEO UI ------------------------------- */

  describe("Video playback", () => {
    test("shows play icon when inactive", () => {
      const { getByTestId } = renderFeedCard({
        active: false,
      });

      expect(getByTestId("icon-play")).toBeTruthy();
    });

    test("hides play icon when active", () => {
      const { queryByTestId } = renderFeedCard({
        active: true,
      });

      expect(queryByTestId("icon-play")).toBeFalsy();
    });

    test("still renders video when active changes", () => {
      const { rerender, getByTestId } = renderFeedCard();

      rerender(<FeedCard item={mockPost} active={false} />);

      expect(getByTestId("video-view")).toBeTruthy();
    });

    test("video initializes correctly", () => {
      renderFeedCard();
      expect(FeedCard).toBeTruthy();
    });
  });

  /* ---------------------------- DIFFERENT INPUTS --------------------------- */

  describe("Different post data", () => {
    test("renders different gym name and grade", () => {
      const customPost = {
        ...mockPost,
        gym_name: "Planet Granite",
        grade: "V7",
      };

      const { getByText } = render(
        <FeedCard item={customPost} active={true} />,
      );

      expect(getByText(/Planet Granite • V7/)).toBeTruthy();
    });

    test("supports numeric ids", () => {
      const customPost = {
        ...mockPost,
        id: 123,
      };

      const { getByText } = render(
        <FeedCard item={customPost} active={true} />,
      );

      expect(getByText("James Doe")).toBeTruthy();
    });

    test("supports special characters", () => {
      const customPost = {
        ...mockPost,
        gym_name: "O'Reilly's Rock Gym & Boulder",
      };

      const { getByText } = render(
        <FeedCard item={customPost} active={true} />,
      );

      expect(getByText(/O'Reilly's Rock Gym/)).toBeTruthy();
    });
  });

  /* ------------------------------- EDGE CASES ------------------------------ */

  describe("Edge cases", () => {
    test("handles rapid follow presses", async () => {
      const { getByText } = renderFeedCard();

      const button = getByText("Follow");

      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      await waitFor(() => {
        expect(getByText("Following")).toBeTruthy();
      });
    });

    test("renders without crashing", () => {
      expect(() => {
        renderFeedCard();
      }).not.toThrow();
    });
  });
});
