import { useSignIn } from "@clerk/expo";
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

const SignIn = () => {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const authScrollContentStyle = {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  };

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [mfaChallengeSent, setMfaChallengeSent] = useState(false);

  // Validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Client-side validation
  const emailValid =
    emailAddress.length === 0 ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
  const passwordValid = password.length > 0;
  const formValid =
    emailAddress.length > 0 && password.length > 0 && emailValid;

  const isMfaStep =
    signIn.status === "needs_second_factor" ||
    signIn.status === "needs_client_trust" ||
    mfaChallengeSent;

  const handleFinalize = async () => {
    await signIn.finalize({
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
  };

  const handleSendMfaCode = async () => {
    await signIn.mfa.sendEmailCode();
    setMfaChallengeSent(true);
  };

  const handleSubmit = async () => {
    if (!formValid) return;

    const { error } = await signIn.password({
      emailAddress,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (signIn.status === "complete") {
      await handleFinalize();
    } else if (isMfaStep) {
      await handleSendMfaCode();
    } else {
      console.error("Sign-in attempt not complete:", signIn);
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === "complete") {
      await handleFinalize();
    } else {
      console.error("Sign-in attempt not complete:", signIn);
    }
  };

  // Show verification screen if client trust is needed
  if (isMfaStep) {
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
                <Text className="auth-title">Verify your identity</Text>
                <Text className="auth-subtitle">
                  We sent a verification code to your email. Enter it below to
                  finish signing in.
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
                      {fetchStatus === "fetching" ? "Verifying..." : "Verify"}
                    </Text>
                  </Pressable>

                  <View className="flex-row justify-between mt-4">
                    <Pressable
                      onPress={handleSendMfaCode}
                      disabled={fetchStatus === "fetching"}
                    >
                      <Text className="text-bb-green font-semibold">
                        Resend Code
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setMfaChallengeSent(false);
                        signIn.reset();
                      }}
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

  // Main sign-in form
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
              <Text className="auth-title">Log In</Text>
              <Text className="auth-subtitle">
                Welcome back to your climbing journey.
              </Text>
            </View>

            {/* Sign-In Form */}
            <View className="auth-card">
              <View className="auth-form">
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
                  {errors.fields.identifier && (
                    <Text className="auth-error">
                      {errors.fields.identifier.message}
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
                      secureTextEntry={!passwordVisible}
                      onChangeText={setPassword}
                      onBlur={() => setPasswordTouched(true)}
                      autoComplete="password"
                    />
                    <Pressable
                      onPress={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-4"
                    >
                      <Feather
                        name={passwordVisible ? "eye" : "eye-off"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  </View>
                  {passwordTouched && !passwordValid && (
                    <Text className="auth-error">Password is required</Text>
                  )}
                  {errors.fields.password && (
                    <Text className="auth-error">
                      {errors.fields.password.message}
                    </Text>
                  )}
                </View>

                <Pressable
                  className={`auth-button ${(!formValid || fetchStatus === "fetching") && "auth-button-disabled"}`}
                  onPress={handleSubmit}
                  disabled={!formValid || fetchStatus === "fetching"}
                >
                  <Text className="auth-button-text">
                    {fetchStatus === "fetching" ? "Logging In..." : "Log In"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Sign-Up Link */}
            <View className="auth-link-row">
              <Text className="auth-link-copy">
                Don&apos;t have an account?
              </Text>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable>
                  <Text className="auth-link">Sign up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
