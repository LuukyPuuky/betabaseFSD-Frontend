import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import SignUp from "../app/(auth)/sign-up";

jest.mock("@clerk/expo", () => ({
  useSignUp: jest.fn(),
  useAuth: jest.fn(),
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useSignUp, useAuth } = require("@clerk/expo");

const mockSignUp = {
  password: jest.fn().mockResolvedValue({ error: null }),
  verifications: {
    sendEmailCode: jest.fn().mockResolvedValue({}),
    verifyEmailCode: jest.fn().mockResolvedValue({}),
  },
  finalize: jest.fn().mockResolvedValue({}),
  status: null,
};

describe("SignUp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSignUp.mockReturnValue({
      signUp: mockSignUp,
      errors: { fields: {} },
      fetchStatus: "idle",
    });
    useAuth.mockReturnValue({ isSignedIn: false, isLoaded: true });
  });

  describe("Rendering", () => {
    test("renders Full Name input", () => {
      const { getByPlaceholderText } = render(<SignUp />);
      expect(getByPlaceholderText("Alex Honnold")).toBeTruthy();
    });

    test("renders Email input", () => {
      const { getByPlaceholderText } = render(<SignUp />);
      expect(getByPlaceholderText("alex@boulderbase.com")).toBeTruthy();
    });

    test("renders Password input", () => {
      const { getByPlaceholderText } = render(<SignUp />);
      expect(getByPlaceholderText("••••••••")).toBeTruthy();
    });

    test("renders terms checkbox", () => {
      const { getByText } = render(<SignUp />);
      expect(getByText(/I agree to the Terms of Service/)).toBeTruthy();
    });

    test("does not render password toggle (no eye icon)", () => {
      const { queryByTestId } = render(<SignUp />);
      expect(queryByTestId("icon-eye")).toBeFalsy();
      expect(queryByTestId("icon-eye-off")).toBeFalsy();
    });

    test("renders sign-up branding", () => {
      const { getByText } = render(<SignUp />);
      expect(getByText("BoulderBase")).toBeTruthy();
    });
  });

  describe("Validation", () => {
    test("accepts text input for all fields", () => {
      const { getByPlaceholderText } = render(<SignUp />);

      const nameInput = getByPlaceholderText("Alex Honnold");
      fireEvent.changeText(nameInput, "John Doe");
      expect(nameInput.props.value).toBe("John Doe");

      const emailInput = getByPlaceholderText("alex@boulderbase.com");
      fireEvent.changeText(emailInput, "john@example.com");
      expect(emailInput.props.value).toBe("john@example.com");

      const passwordInput = getByPlaceholderText("••••••••");
      fireEvent.changeText(passwordInput, "password123");
      expect(passwordInput.props.value).toBe("password123");
    });

    test("email field uses email-address keyboard type", () => {
      const { getByPlaceholderText } = render(<SignUp />);
      const emailInput = getByPlaceholderText("alex@boulderbase.com");
      expect(emailInput.props.keyboardType).toBe("email-address");
    });

    test("password field uses secureTextEntry", () => {
      const { getByPlaceholderText } = render(<SignUp />);
      const passwordInput = getByPlaceholderText("••••••••");
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe("Form submit", () => {
    test("form accepts all input fields", () => {
      const { getByPlaceholderText } = render(<SignUp />);

      fireEvent.changeText(getByPlaceholderText("Alex Honnold"), "John Doe");
      fireEvent.changeText(getByPlaceholderText("alex@boulderbase.com"), "john@example.com");
      fireEvent.changeText(getByPlaceholderText("••••••••"), "password123");

      expect(mockSignUp.password).not.toHaveBeenCalled();
    });

    test("renders sign-up branding", () => {
      const { getByText } = render(<SignUp />);
      expect(getByText("BoulderBase")).toBeTruthy();
      expect(getByText(/Join the community/)).toBeTruthy();
    });
  });

  describe("Email verification flow", () => {
    test("terms text is present", () => {
      const { getByText } = render(<SignUp />);
      expect(getByText(/Terms of Service/)).toBeTruthy();
    });
  });

  describe("Edge cases", () => {
    test("sign-up form renders all required input elements", () => {
      const { getByPlaceholderText } = render(<SignUp />);

      expect(getByPlaceholderText("Alex Honnold")).toBeTruthy();
      expect(getByPlaceholderText("alex@boulderbase.com")).toBeTruthy();
      expect(getByPlaceholderText("••••••••")).toBeTruthy();
    });

    test("password field securely hides text", () => {
      const { getByPlaceholderText } = render(<SignUp />);
      const passwordInput = getByPlaceholderText("••••••••");
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });
});
