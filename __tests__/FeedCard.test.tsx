/**
 * FeedCard.test.tsx
 *
 * What is tested (live, data-driven FeedCard):
 * - Real author rendering (no mock data)
 * - SoundCloud-style timeline note markers + popover
 * - Like toggle (optimistic + persistence)
 * - Add-note composer inserting at the current timestamp
 * - Follow button behavior / hidden on own post
 */

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Share } from "react-native";

import FeedCard from "../app/components/FeedCard";

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                     */
/* -------------------------------------------------------------------------- */

jest.mock("@clerk/expo", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  useSupabase: jest.fn(),
}));

jest.mock("expo", () => ({
  // useEvent(player, name, initialValue) -> returns the initial value object.
  useEvent: (_emitter: any, _name: string, initial: any) => initial,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));

jest.mock("expo-video", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    useVideoPlayer: (_src: any, setup?: (p: any) => void) => {
      const player: any = {
        currentTime: 37,
        duration: 143,
        status: "readyToPlay",
        loop: false,
        muted: false,
        timeUpdateEventInterval: 0,
        play: jest.fn(),
        pause: jest.fn(),
      };
      if (setup) setup(player);
      return player;
    },
    VideoView: ({ style }: any) => <View style={style} testID="video-view" />,
  };
});

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light" },
}));

jest.mock("expo-image", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Image: ({ source }: any) => (
      <View testID={`image-${source?.uri || "placeholder"}`} />
    ),
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Feather: ({ name }: any) => <View testID={`icon-${name}`} />,
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAuth } = require("@clerk/expo");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useSupabase } = require("@/lib/supabase");

/* -------------------------------------------------------------------------- */
/*                          SUPABASE QUERY-BUILDER MOCK                        */
/* -------------------------------------------------------------------------- */

type Config = {
  profiles?: any;
  profilesError?: any;
  post_notes?: any[];
  post_likes?: any[];
  follows?: any[];
};

function makeSupabase(config: Config) {
  const inserts: Record<string, any[]> = {
    post_notes: [],
    post_likes: [],
    follows: [],
  };
  const deletes: Record<string, number> = { post_likes: 0, follows: 0 };

  function resolveSelect(table: string) {
    switch (table) {
      case "profiles":
        return {
          data: config.profiles ?? null,
          error: config.profilesError ?? null,
        };
      case "post_notes":
        return { data: config.post_notes ?? [], error: null };
      case "post_likes":
        return { data: config.post_likes ?? [], error: null };
      case "follows":
        return { data: config.follows ?? [], error: null };
      default:
        return { data: [], error: null };
    }
  }

  function builder(table: string) {
    const state = { op: "select" as "select" | "insert" | "delete" };

    const b: any = {
      select: () => b,
      order: () => b,
      eq: () => b,
      single: () => b,
      insert: (row: any) => {
        state.op = "insert";
        inserts[table]?.push(row);
        return b;
      },
      delete: () => {
        state.op = "delete";
        deletes[table] = (deletes[table] ?? 0) + 1;
        return b;
      },
      then: (resolve: any, reject: any) => {
        const result =
          state.op === "select"
            ? resolveSelect(table)
            : { data: null, error: null };
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return b;
  }

  return { from: jest.fn(builder), __inserts: inserts, __deletes: deletes };
}

/* -------------------------------------------------------------------------- */
/*                                  FIXTURES                                   */
/* -------------------------------------------------------------------------- */

const post = {
  id: "post-1",
  gym_name: "Yosemite",
  grade: "V14",
  climbing_style: "Dynamic",
  description: "The Nose",
  video_url: "https://example.com/video.mp4",
  user_id: "author-1",
};

const note = {
  id: "note-1",
  post_id: "post-1",
  user_id: "commenter-9",
  timestamp_seconds: 37,
  body: "Try to use the crimp here!",
  author: { username: "Jimmy Q.", avatar_url: null },
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ userId: "viewer-1" });
});

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                     */
/* -------------------------------------------------------------------------- */

describe("FeedCard", () => {
  test("renders the real author, not mock data", async () => {
    useSupabase.mockReturnValue(
      makeSupabase({ profiles: { username: "Alex H.", avatar_url: null } }),
    );

    const { getByTestId, queryByText } = render(
      <FeedCard item={post} active={false} />,
    );

    await waitFor(() => {
      expect(getByTestId("feed-author-name").props.children).toBe("Alex H.");
    });
    expect(queryByText("James Doe")).toBeNull();
  });

  test("renders the post gym and grade", async () => {
    useSupabase.mockReturnValue(
      makeSupabase({ profiles: { username: "Alex H.", avatar_url: null } }),
    );

    const { getByText } = render(<FeedCard item={post} active={false} />);
    expect(getByText(/Yosemite • V14/)).toBeTruthy();
  });

  test("renders a marker for each timeline note", async () => {
    useSupabase.mockReturnValue(
      makeSupabase({
        profiles: { username: "Alex H.", avatar_url: null },
        post_notes: [note, { ...note, id: "note-2", timestamp_seconds: 90 }],
      }),
    );

    const { getByTestId } = render(<FeedCard item={post} active={false} />);

    await waitFor(() => {
      expect(getByTestId("note-marker-note-1")).toBeTruthy();
      expect(getByTestId("note-marker-note-2")).toBeTruthy();
    });
  });

  test("tapping a marker shows the note popover", async () => {
    useSupabase.mockReturnValue(
      makeSupabase({
        profiles: { username: "Alex H.", avatar_url: null },
        post_notes: [note],
      }),
    );

    const { getByTestId, getByText } = render(
      <FeedCard item={post} active={false} />,
    );

    await waitFor(() => expect(getByTestId("note-marker-note-1")).toBeTruthy());

    fireEvent.press(getByTestId("note-marker-note-1"));

    expect(getByTestId("note-popover")).toBeTruthy();
    expect(getByText("Try to use the crimp here!")).toBeTruthy();
    expect(getByText(/Jimmy Q\./)).toBeTruthy();
  });

  test("like button toggles count and persists a like", async () => {
    const supabase = makeSupabase({
      profiles: { username: "Alex H.", avatar_url: null },
      post_likes: [],
    });
    useSupabase.mockReturnValue(supabase);

    const { getByTestId } = render(<FeedCard item={post} active={false} />);

    await waitFor(() =>
      expect(getByTestId("like-count").props.children).toBe("0"),
    );

    fireEvent.press(getByTestId("like-button"));

    await waitFor(() =>
      expect(getByTestId("like-count").props.children).toBe("1"),
    );
    expect(supabase.__inserts.post_likes).toContainEqual({
      user_id: "viewer-1",
      post_id: "post-1",
    });
  });

  test("add-note composer inserts a note at the current timestamp", async () => {
    const supabase = makeSupabase({
      profiles: { username: "Alex H.", avatar_url: null },
    });
    useSupabase.mockReturnValue(supabase);

    const { getByTestId } = render(<FeedCard item={post} active={false} />);

    fireEvent.press(getByTestId("add-note-button"));

    fireEvent.changeText(
      getByTestId("note-composer-input"),
      "Heel hook on the arete",
    );
    fireEvent.press(getByTestId("note-composer-submit"));

    await waitFor(() => {
      expect(supabase.__inserts.post_notes).toContainEqual({
        post_id: "post-1",
        user_id: "viewer-1",
        timestamp_seconds: 37,
        body: "Heel hook on the arete",
      });
    });
  });

  test("hides the follow button on your own post", async () => {
    useAuth.mockReturnValue({ userId: "author-1" }); // same as post.user_id
    useSupabase.mockReturnValue(
      makeSupabase({ profiles: { username: "Me", avatar_url: null } }),
    );

    const { queryByTestId } = render(<FeedCard item={post} active={false} />);

    await waitFor(() => expect(queryByTestId("feed-card")).toBeTruthy());
    expect(queryByTestId("follow-button")).toBeNull();
  });

  test("follow button toggles to Following and persists", async () => {
    const supabase = makeSupabase({
      profiles: { username: "Alex H.", avatar_url: null },
      follows: [],
    });
    useSupabase.mockReturnValue(supabase);

    const { getByTestId, getByText } = render(
      <FeedCard item={post} active={false} />,
    );

    await waitFor(() => expect(getByTestId("follow-button")).toBeTruthy());

    fireEvent.press(getByTestId("follow-button"));

    await waitFor(() => expect(getByText("Following")).toBeTruthy());
    expect(supabase.__inserts.follows).toContainEqual({
      follower_id: "viewer-1",
      following_id: "author-1",
    });
  });

  test("share button opens the native share sheet with the video link", async () => {
    const shareSpy = jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: "sharedAction" } as any);
    useSupabase.mockReturnValue(
      makeSupabase({ profiles: { username: "Alex H.", avatar_url: null } }),
    );

    const { getByTestId } = render(
      <FeedCard item={post} active={false} height={800} />,
    );

    fireEvent.press(getByTestId("share-button"));

    await waitFor(() => expect(shareSpy).toHaveBeenCalled());
    expect(shareSpy.mock.calls[0][0]).toEqual(
      expect.objectContaining({ url: post.video_url }),
    );
    shareSpy.mockRestore();
  });

  test("renders without crashing", () => {
    useSupabase.mockReturnValue(makeSupabase({}));
    expect(() =>
      render(<FeedCard item={post} active={false} height={800} />),
    ).not.toThrow();
  });
});
