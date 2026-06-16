import { Feather } from "@expo/vector-icons";
import { Link, Tabs } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#5A8B5F",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopColor: "#1a1a1a",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color }) => (
            <Feather name="users" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View
              className={`w-16 h-10 rounded-xl items-center justify-center mt-3 ${focused ? "bg-bb-green" : "bg-bb-card"}`}
            >
              <Feather
                name="plus"
                size={24}
                color={focused ? "#ffffff" : "#5A8B5F"}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <Feather name="message-circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: true,
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "#F3F4F6",
          headerShadowVisible: false,
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          ),
          headerLeft: () => (
            <Link href={"/settings" as any} asChild>
              <Pressable className="ml-4">
                <Feather name="settings" size={24} color="#F3F4F6" />
              </Pressable>
            </Link>
          ),
          headerRight: () => (
            <Pressable className="mr-4">
              <Feather name="share-2" size={24} color="#F3F4F6" />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}
