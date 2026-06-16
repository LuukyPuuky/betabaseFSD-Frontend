import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

interface Post {
  id: string;
  gym_name: string;
  grade: string;
  climbing_style: string;
  description: string;
  video_url: string;
  user_id: string;
  view_count: number;
  created_at: string;
}

interface ProfileVideoGridProps {
  post: Post;
}

function ProfileVideoGridCell({ post }: ProfileVideoGridProps) {
  const formatViewCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <Pressable className="flex-1 aspect-square rounded-lg overflow-hidden bg-bb-card">
      {/* Thumbnail */}
      <View className="w-full h-full relative bg-bb-card">
        <Image
          source={{ uri: post.video_url }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />

        {/* Overlay gradient + play icon + view count */}
        <View className="absolute inset-0 bg-black/20 items-end justify-end p-2">
          <View className="flex-row items-center gap-1 bg-black/60 px-2 py-1 rounded-md">
            <Feather name="play" size={12} color="#ffffff" />
            <Text className="text-white text-xs font-semibold">
              {formatViewCount(post.view_count)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(ProfileVideoGridCell);
