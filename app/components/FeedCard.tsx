import { Feather } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

const MOCK_USER_NAME = "James Doe";
const MOCK_AVATAR_COLOR = "#E07B39";
const MOCK_AVATAR_INITIALS = "JD";
const MOCK_LIKE_COUNT = "1.2k";
const MOCK_PROGRESS = 0.37;
const MOCK_TIME = "0:37 / 2:23";
const MOCK_DOTS = [0.15, 0.37, 0.65, 0.88];

type FeedPost = {
  id: string | number;
  gym_name: string;
  grade: string | number;
  climbing_style: string;
  description: string;
  video_url: string;
};

type FeedCardProps = {
  item: FeedPost;
  active: boolean;
};

export default function FeedCard({ item, active }: FeedCardProps) {
  const [following, setFollowing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(active);
  const player = useVideoPlayer(item.video_url, (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying, player]);

  useEffect(() => {
    setIsPlaying(active);
  }, [active]);

  return (
    <View className="bg-bb-card rounded-2xl overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: MOCK_AVATAR_COLOR }}
        >
          <Text className="text-white text-sm font-bold">
            {MOCK_AVATAR_INITIALS}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="text-bb-text font-semibold text-sm">
            {MOCK_USER_NAME}
          </Text>
          <Text
            className="text-bb-text-muted text-xs mt-0.5"
            numberOfLines={1}
          >
            {item.gym_name} • V{item.grade}
          </Text>
        </View>

        <Pressable
          onPress={() => setFollowing((f) => !f)}
          className={
            following
              ? "border border-bb-green px-4 py-1.5 rounded-full"
              : "bg-bb-green px-4 py-1.5 rounded-full"
          }
        >
          <Text
            className={
              following
                ? "text-bb-green text-xs font-semibold"
                : "text-white text-xs font-semibold"
            }
          >
            {following ? "Following" : "Follow"}
          </Text>
        </Pressable>
      </View>

      {/* Video */}
      <View
        className="mx-4 rounded-2xl overflow-hidden"
        style={{ aspectRatio: 4 / 5 }}
      >
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          nativeControls={false}
        />

        {/* Play/Pause Overlay */}
        <Pressable
          onPress={() => setIsPlaying((p) => !p)}
          className="absolute inset-0 items-center justify-center"
        >
          {!isPlaying && (
            <View className="w-14 h-14 rounded-full bg-black/50 items-center justify-center">
              <Feather name="play" size={26} color="#fff" />
            </View>
          )}
        </Pressable>

        {/* Progress Bar Overlay */}
        <View className="absolute bottom-0 left-0 right-0 px-3 pb-3">
          <View className="h-1 bg-white/30 rounded-full w-full mb-2">
            <View
              className="h-1 bg-bb-green rounded-full"
              style={{ width: `${MOCK_PROGRESS * 100}%` }}
            />
            {MOCK_DOTS.map((pos, i) => (
              <View
                key={i}
                className="absolute w-2 h-2 rounded-full bg-white -mt-0.5"
                style={{ left: `${pos * 100}%`, marginLeft: -4 }}
              />
            ))}
          </View>
          <Text className="text-white text-xs">{MOCK_TIME}</Text>
        </View>
      </View>

      {/* Action Bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-4">
          <Pressable className="flex-row items-center gap-1.5">
            <Feather name="heart" size={20} color="#ef4444" />
            <Text className="text-bb-text-muted text-sm">{MOCK_LIKE_COUNT}</Text>
          </Pressable>

          <Pressable>
            <Feather name="share-2" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        <Pressable className="flex-row items-center gap-1.5 border border-bb-green rounded-full px-3 py-1.5">
          <Feather name="edit-2" size={14} color="#5A8B5F" />
          <Text className="text-bb-green text-xs font-semibold">Add Note</Text>
        </Pressable>
      </View>
    </View>
  );
}
