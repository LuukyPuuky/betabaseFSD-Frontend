import { render } from "@testing-library/react-native";
import React from "react";
import Chat from "../app/(tabs)/chat";
import Friends from "../app/(tabs)/friends";
import Profile from "../app/(tabs)/profile";

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
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
    test("renders without crashing", () => {
      expect(() => {
        render(<Profile />);
      }).not.toThrow();
    });

    test("renders Profile text", () => {
      const { getByText } = render(<Profile />);
      expect(getByText("Profile")).toBeTruthy();
    });
  });
});
