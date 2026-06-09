import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import Settings from "../app/settings";

jest.mock("@clerk/expo", () => ({
  useClerk: jest.fn(),
}));

const { useClerk } = require("@clerk/expo");

describe("Settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useClerk.mockReturnValue({ signOut: jest.fn() });
  });

  describe("Rendering", () => {
    test("renders Log Out button", () => {
      const { getByText } = render(<Settings />);
      expect(getByText("Log Out")).toBeTruthy();
    });
  });

  describe("Sign out", () => {
    test("pressing Log Out calls signOut", async () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined);
      useClerk.mockReturnValue({ signOut: mockSignOut });

      const { getByText } = render(<Settings />);
      fireEvent.press(getByText("Log Out"));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    test("Log Out button exists and can be interacted with", () => {
      useClerk.mockReturnValue({ signOut: jest.fn() });

      const { getByText } = render(<Settings />);
      const button = getByText("Log Out");

      expect(button).toBeTruthy();
      expect(button.type).toBe("Text");
    });
  });
});
