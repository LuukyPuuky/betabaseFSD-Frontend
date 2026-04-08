import { useClerk } from "@clerk/expo";
import { View, Text, Pressable } from "react-native";

export default function Settings() {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View className="flex-1 bg-bb-bg p-6">
      <Pressable 
        className="w-full bg-bb-card p-4 rounded-xl flex-row justify-between items-center mt-4 border border-bb-input-border"
        onPress={handleSignOut}
      >
        <Text className="text-red-500 font-bold text-lg">Log Out</Text>
      </Pressable>
    </View>
  );
}
