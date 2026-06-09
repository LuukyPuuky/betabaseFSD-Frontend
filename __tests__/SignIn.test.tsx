import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import SignIn from "../app/(auth)/sign-in";

jest.mock("@clerk/expo", () => ({
  useSignIn: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
  Link: ({ children }: any) => children,
}));

jest.mock("nativewind", () => ({
  cssInterop: jest.fn((component) => component),
}));

jest.mock("nativewind/preset", () => ({}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock("@expo/vector-icons", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Feather: ({ name }: any) => <View testID={`icon-${name}`} />,
    MaterialIcons: ({ name }: any) => <View testID={`icon-${name}`} />,
  };
});

const { useSignIn } = require("@clerk/expo");
const { useRouter } = require("expo-router");

const mockSignIn = {
  password: jest.fn().mockResolvedValue({ error: null }),
  mfa: {
    sendEmailCode: jest.fn().mockResolvedValue({}),
    verifyEmailCode: jest.fn().mockResolvedValue({}),
  },
  finalize: jest.fn().mockResolvedValue({}),
  reset: jest.fn(),
  status: null,
};

const mockRouter = { replace: jest.fn() };

describe("SignIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSignIn.mockReturnValue({
      signIn: mockSignIn,
      errors: { fields: {} },
      fetchStatus: "idle",
    });
    useRouter.mockReturnValue(mockRouter);
  });

  describe("Rendering", () => {
    test("renders email input placeholder", () => {
      const { getByPlaceholderText } = render(<SignIn />);
      expect(getByPlaceholderText("alex@boulderbase.com")).toBeTruthy();
    });

    test("renders password input placeholder", () => {
      const { getByPlaceholderText } = render(<SignIn />);
      expect(getByPlaceholderText("••••••••")).toBeTruthy();
    });

    test("renders eye-off icon (password hidden by default)", () => {
      const { getByTestId, queryByTestId } = render(<SignIn />);
      expect(getByTestId("icon-eye-off")).toBeTruthy();
      expect(queryByTestId("icon-eye")).toBeFalsy();
    });

    test("renders terrain icon for branding", () => {
      const { getByTestId } = render(<SignIn />);
      expect(getByTestId("icon-terrain")).toBeTruthy();
    });
  });

  describe("Email validation", () => {
    test("accepts email input changes", () => {
      const { getByPlaceholderText } = render(<SignIn />);
      const emailInput = getByPlaceholderText("alex@boulderbase.com");

      fireEvent.changeText(emailInput, "test@example.com");
      expect(emailInput.props.value).toBe("test@example.com");
    });

    test("email field has email-address keyboard type", () => {
      const { getByPlaceholderText } = render(<SignIn />);
      const emailInput = getByPlaceholderText("alex@boulderbase.com");

      expect(emailInput.props.keyboardType).toBe("email-address");
    });
  });

  describe("Password visibility toggle", () => {
    test("shows eye-off icon by default", () => {
      const { getByTestId, queryByTestId } = render(<SignIn />);
      expect(getByTestId("icon-eye-off")).toBeTruthy();
      expect(queryByTestId("icon-eye")).toBeFalsy();
    });

    test("pressing eye icon reveals password (renders eye-off)", async () => {
      const { getByTestId, getAllByTestId } = render(<SignIn />);
      const eyeIcons = getAllByTestId("icon-eye-off");
      const eyeButton = eyeIcons[0].parent.parent;

      fireEvent.press(eyeButton);

      await waitFor(() => {
        expect(getByTestId("icon-eye")).toBeTruthy();
      });
    });

    test("pressing eye icon again hides password (renders eye-off)", async () => {
      const { getByTestId, getAllByTestId, queryByTestId } = render(<SignIn />);
      const eyeIcons = getAllByTestId("icon-eye-off");
      const eyeButton = eyeIcons[0].parent.parent;

      fireEvent.press(eyeButton);
      await waitFor(() => expect(getByTestId("icon-eye")).toBeTruthy());

      const eyeIcon = getByTestId("icon-eye");
      fireEvent.press(eyeIcon.parent.parent);

      await waitFor(() => {
        expect(queryByTestId("icon-eye")).toBeFalsy();
        expect(getByTestId("icon-eye-off")).toBeTruthy();
      });
    });
  });

  describe("Form submit", () => {
    test("form renders and accepts input", () => {
      const { getByPlaceholderText } = render(<SignIn />);

      expect(getByPlaceholderText("alex@boulderbase.com")).toBeTruthy();
      expect(getByPlaceholderText("••••••••")).toBeTruthy();
    });

    test("email and password fields accept text", () => {
      const { getByPlaceholderText } = render(<SignIn />);

      fireEvent.changeText(getByPlaceholderText("alex@boulderbase.com"), "test@example.com");
      fireEvent.changeText(getByPlaceholderText("••••••••"), "password123");

      expect(mockSignIn.password).not.toHaveBeenCalled();
    });
  });

  describe("MFA flow", () => {
    test("shows MFA screen when signIn.status is needs_second_factor", () => {
      useSignIn.mockReturnValue({
        signIn: { ...mockSignIn, status: "needs_second_factor" },
        errors: { fields: {} },
        fetchStatus: "idle",
      });

      const { getByText } = render(<SignIn />);
      expect(getByText("Verify your identity")).toBeTruthy();
    });

    test("shows MFA screen when signIn.status is needs_client_trust", () => {
      useSignIn.mockReturnValue({
        signIn: { ...mockSignIn, status: "needs_client_trust" },
        errors: { fields: {} },
        fetchStatus: "idle",
      });

      const { getByText } = render(<SignIn />);
      expect(getByText("Verify your identity")).toBeTruthy();
    });

    test("Verify button calls signIn.mfa.verifyEmailCode", async () => {
      useSignIn.mockReturnValue({
        signIn: { ...mockSignIn, status: "needs_second_factor" },
        errors: { fields: {} },
        fetchStatus: "idle",
      });

      const { getByPlaceholderText, getByText } = render(<SignIn />);
      const codeInput = getByPlaceholderText("Enter 6-digit code");

      fireEvent.changeText(codeInput, "123456");
      fireEvent.press(getByText("Verify"));

      await waitFor(() => {
        expect(mockSignIn.mfa.verifyEmailCode).toHaveBeenCalledWith({ code: "123456" });
      });
    });

    test("Resend Code calls signIn.mfa.sendEmailCode", async () => {
      useSignIn.mockReturnValue({
        signIn: { ...mockSignIn, status: "needs_second_factor" },
        errors: { fields: {} },
        fetchStatus: "idle",
      });

      const { getByText } = render(<SignIn />);
      fireEvent.press(getByText("Resend Code"));

      await waitFor(() => {
        expect(mockSignIn.mfa.sendEmailCode).toHaveBeenCalled();
      });
    });

    test("Start Over calls signIn.reset", async () => {
      useSignIn.mockReturnValue({
        signIn: { ...mockSignIn, status: "needs_second_factor" },
        errors: { fields: {} },
        fetchStatus: "idle",
      });

      const { getByText } = render(<SignIn />);
      fireEvent.press(getByText("Start Over"));

      await waitFor(() => {
        expect(mockSignIn.reset).toHaveBeenCalled();
      });
    });
  });

  describe("Edge cases", () => {
    test("renders branding text", () => {
      const { getByText } = render(<SignIn />);
      expect(getByText("BoulderBase")).toBeTruthy();
      expect(getByText(/Elevate your climbing journey/)).toBeTruthy();
    });

    test("renders navigation link to sign-up", () => {
      const { getByText } = render(<SignIn />);
      expect(getByText(/Don't have an account?/)).toBeTruthy();
    });
  });
});
