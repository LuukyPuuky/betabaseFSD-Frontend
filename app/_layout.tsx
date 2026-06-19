import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import "./globals.css";

interface Env {
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
}

const env = process.env as unknown as Env;

const publishableKey = env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Land on the tab navigator (Home) on cold start, not the settings modal.
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

console.log("KEY:", publishableKey);

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isSignedIn && inAuthGroup) {
      router.replace("/");
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    }
  }, [isSignedIn, segments, isLoaded, router]);

  if (!isLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Declared first so the tab navigator (Home) is the anchor/initial
          route on cold start instead of the settings modal. */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen
        name="settings"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Settings",
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "#F3F4F6",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <InitialLayout />
    </ClerkProvider>
  );
}
