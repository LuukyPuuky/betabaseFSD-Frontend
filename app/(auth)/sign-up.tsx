import { useAuth, useSignUp } from "@clerk/expo";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { Link, useRouter, type Href } from "expo-router";
import { cssInterop } from "nativewind";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

cssInterop(SafeAreaView, { className: "style" });

const SignUp = () => {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const authScrollContentStyle = {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  };

  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  // Validation states
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Client-side validation
  const fullNameValid = fullName.trim().length > 0;
  const emailValid =
    emailAddress.length === 0 ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
  const passwordValid = password.length === 0 || password.length >= 8;

  const formValid =
    fullName.trim().length > 0 &&
    emailAddress.length > 0 &&
    password.length >= 8 &&
    emailValid &&
    termsAccepted;

  const handleSubmit = async () => {
    if (!formValid) return;

    // First/Last name logic can be added depending on Clerk settings
    const { error } = await signUp.password({
      emailAddress,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    // Send verification email
    if (!error) {
      await signUp.verifications.sendEmailCode();
      setPendingVerification(true);
    }
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({
      code,
    });

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }

          const url = decorateUrl("/(tabs)");
          if (url.startsWith("http")) {
            // Only use window.location on web platform
            if (typeof window !== "undefined" && window.location) {
              window.location.href = url;
            } else {
              // On native, just use router navigation
              router.replace("/(tabs)" as Href);
            }
          } else {
            router.replace(url as Href);
          }
        },
      });
    } else {
      console.error("Sign-up attempt not complete:", signUp);
    }
  };

  // Don't show anything if already signed in or sign-up is complete
  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  // Show verification screen if email needs verification and user just submitted
  if (pendingVerification) {
    return (
      <SafeAreaView className="auth-safe-area">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="auth-screen"
        >
          <ScrollView
            className="auth-scroll"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="auth-content">
              {/* Branding */}
              <View className="auth-brand-block">
                <View className="auth-logo-wrap">
                  <View className="auth-logo-mark">
                    <MaterialIcons name="terrain" size={32} color="#ffffff" />
                  </View>
                  <Text className="auth-wordmark">BoulderBase</Text>
                  <Text className="auth-wordmark-sub">
                    Elevate your climbing journey
                  </Text>
                </View>
              </View>

              <View className="auth-header-block">
                <Text className="auth-title">Verify your email</Text>
                <Text className="auth-subtitle">
                  We sent a verification code to {emailAddress}
                </Text>
              </View>

              {/* Verification Form */}
              <View className="auth-card">
                <View className="auth-form">
                  <View className="auth-field">
                    <Text className="auth-label">Verification Code</Text>
                    <View className="auth-input-container">
                      <Feather
                        name="shield"
                        size={20}
                        color="#9CA3AF"
                        className="auth-input-icon"
                      />
                      <TextInput
                        className="auth-input"
                        value={code}
                        placeholder="Enter 6-digit code"
                        placeholderTextColor="#9CA3AF"
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        autoComplete="one-time-code"
                        maxLength={6}
                      />
                    </View>
                    {errors.fields.code && (
                      <Text className="auth-error">
                        {errors.fields.code.message}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    className={`auth-button ${(!code || fetchStatus === "fetching") && "auth-button-disabled"}`}
                    onPress={handleVerify}
                    disabled={!code || fetchStatus === "fetching"}
                  >
                    <Text className="auth-button-text">
                      {fetchStatus === "fetching"
                        ? "Verifying..."
                        : "Verify Email"}
                    </Text>
                  </Pressable>

                  <View className="flex-row justify-between mt-4">
                    <Pressable
                      onPress={() => signUp.verifications.sendEmailCode()}
                      disabled={fetchStatus === "fetching"}
                    >
                      <Text className="text-bb-green font-semibold">
                        Resend Code
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setPendingVerification(false)}
                      disabled={fetchStatus === "fetching"}
                    >
                      <Text className="text-bb-green font-semibold">
                        Start Over
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Main sign-up form
  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="auth-screen"
      >
        <ScrollView
          className="auth-scroll"
          contentContainerStyle={authScrollContentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-content">
            {/* Branding */}
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                  <MaterialIcons name="terrain" size={32} color="#ffffff" />
                </View>
                <Text className="auth-wordmark">BoulderBase</Text>
                <Text className="auth-wordmark-sub">
                  Elevate your climbing journey
                </Text>
              </View>
            </View>

            <View className="auth-header-block">
              <Text className="auth-title">Create Account</Text>
              <Text className="auth-subtitle">
                Join the community and share your beta.
              </Text>
            </View>

            {/* Sign-Up Form */}
            <View className="auth-card">
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Full Name</Text>
                  <View className="auth-input-container">
                    <Feather
                      name="user"
                      size={20}
                      color="#9CA3AF"
                      className="auth-input-icon"
                    />
                    <TextInput
                      className={`auth-input ${fullNameTouched && !fullNameValid && "auth-input-error"}`}
                      value={fullName}
                      placeholder="Alex Honnold"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={setFullName}
                      onBlur={() => setFullNameTouched(true)}
                    />
                  </View>
                  {fullNameTouched && !fullNameValid && (
                    <Text className="auth-error">Full name is required</Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Email Address</Text>
                  <View className="auth-input-container">
                    <Feather
                      name="mail"
                      size={20}
                      color="#9CA3AF"
                      className="auth-input-icon"
                    />
                    <TextInput
                      className={`auth-input ${emailTouched && !emailValid && "auth-input-error"}`}
                      autoCapitalize="none"
                      value={emailAddress}
                      placeholder="alex@boulderbase.com"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={setEmailAddress}
                      onBlur={() => setEmailTouched(true)}
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>
                  {emailTouched && !emailValid && (
                    <Text className="auth-error">
                      Please enter a valid email address
                    </Text>
                  )}
                  {errors.fields.emailAddress && (
                    <Text className="auth-error">
                      {errors.fields.emailAddress.message}
                    </Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <View className="auth-input-container">
                    <Feather
                      name="lock"
                      size={20}
                      color="#9CA3AF"
                      className="auth-input-icon"
                    />
                    <TextInput
                      className={`auth-input ${passwordTouched && !passwordValid && "auth-input-error"}`}
                      value={password}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      onChangeText={setPassword}
                      onBlur={() => setPasswordTouched(true)}
                      autoComplete="password-new"
                    />
                  </View>
                  {passwordTouched && !passwordValid && (
                    <Text className="auth-error">
                      Password must be at least 8 characters
                    </Text>
                  )}
                  {errors.fields.password && (
                    <Text className="auth-error">
                      {errors.fields.password.message}
                    </Text>
                  )}
                </View>

                {/* Terms Checkbox */}
                <View className="mt-2 mb-1">
                  <Pressable
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    className="flex-row items-center gap-3"
                  >
                    <View
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${termsAccepted ? "bg-bb-green border-bb-green" : "bg-bb-checkbox border-bb-checkbox-border"}`}
                    >
                      {termsAccepted && (
                        <Feather name="check" size={14} color="#ffffff" />
                      )}
                    </View>
                    <Text className="text-bb-text text-sm flex-1">
                      I agree to the{" "}
                      <Text className="text-bb-green">Terms of Service</Text>{" "}
                      and <Text className="text-bb-green">Privacy Policy</Text>
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  className={`auth-button ${(!formValid || fetchStatus === "fetching") && "auth-button-disabled"}`}
                  onPress={handleSubmit}
                  disabled={!formValid || fetchStatus === "fetching"}
                >
                  <Text className="auth-button-text">
                    {fetchStatus === "fetching"
                      ? "Creating Account..."
                      : "Create Account"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Sign-In Link */}
            <View className="auth-link-row">
              <Text className="auth-link-copy">Already have an account?</Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable>
                  <Text className="auth-link">Log in</Text>
                </Pressable>
              </Link>
            </View>

            {/* Required for Clerk's bot protection */}
            <View nativeID="clerk-captcha" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
