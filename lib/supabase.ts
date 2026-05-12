import { useAuth } from "@clerk/expo";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase environment variables.\n` +
      `EXPO_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗ MISSING"}\n` +
      `EXPO_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✓" : "✗ MISSING"}\n` +
      `Make sure your .env file exists and restart with: npx expo start --clear`,
  );
}

// Call this hook in your components to get an authenticated client
export function useSupabase() {
  const { getToken } = useAuth();

  const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      fetch: async (url, options = {}) => {
        // Attach the Clerk JWT to every request so RLS knows who you are
        const clerkToken = await getToken({ template: "supabase" });
        const headers = new Headers(options?.headers);
        if (clerkToken) headers.set("Authorization", `Bearer ${clerkToken}`);
        return fetch(url, { ...options, headers });
      },
    },
  });

  return supabase;
}
