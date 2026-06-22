import { useAuth, useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSupabase } from "@/lib/supabase";
import ProfileVideoGrid from "@/app/components/ProfileVideoGrid";

interface ProfileData {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  grade: string | null;
  followers_count: number;
  following_count: number;
  sends_count: number;
}

interface Post {
  id: string;
  gym_name: string;
  grade: string;
  climbing_style: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  user_id: string;
  view_count: number;
  created_at: string;
}

export default function Profile() {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const supabaseClient = useSupabase();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "liked">("my");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Clerk returns a new `user` object reference on most renders. Keep it in a
  // ref so the data-fetching callbacks below don't list it as a dependency
  // (which would recreate them every render and cause an infinite reload loop).
  const userRef = useRef(user);
  userRef.current = user;

  const fetchProfile = useCallback(async () => {
    if (!userId || !isLoaded) return;

    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data);
      } else if (error?.code === "PGRST116") {
        // No row found, create default profile
        const { data: newProfile } = await supabaseClient
          .from("profiles")
          .insert({
            id: userId,
            username:
              userRef.current?.username ||
              userRef.current?.fullName ||
              "Climber",
            avatar_url: userRef.current?.imageUrl || null,
            bio: null,
            grade: "Beginner",
          })
          .select()
          .single();

        if (newProfile) {
          setProfile(newProfile);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }, [userId, isLoaded, supabaseClient]);

  const fetchMyPosts = useCallback(async () => {
    if (!userId || !isLoaded) return;

    try {
      const { data, error } = await supabaseClient
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMyPosts(data);
      }
    } catch (err) {
      console.error("Error fetching my posts:", err);
    }
  }, [userId, isLoaded, supabaseClient]);

  const fetchLikedPosts = useCallback(async () => {
    if (!userId || !isLoaded) return;

    try {
      const { data, error } = await supabaseClient
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .then(async (result: any) => {
          if (result.error) return result;

          const likeIds = (result.data || []).map((l: any) => l.post_id);
          if (likeIds.length === 0) return { data: [], error: null };

          const { data: posts, error: postsError } = await supabaseClient
            .from("posts")
            .select("*")
            .in("id", likeIds)
            .order("created_at", { ascending: false });

          return { data: posts, error: postsError };
        });

      if (!error && data) {
        setLikedPosts(data);
      }
    } catch (err) {
      console.error("Error fetching liked posts:", err);
    }
  }, [userId, isLoaded, supabaseClient]);

  const loadPostsOnly = useCallback(async () => {
    if (!userId || !isLoaded) return;
    await Promise.all([fetchMyPosts(), fetchLikedPosts()]);
  }, [userId, isLoaded, fetchMyPosts, fetchLikedPosts]);

  const loadData = useCallback(async () => {
    if (!userId || !isLoaded) return;
    setLoading(true);
    await Promise.all([fetchProfile(), fetchMyPosts(), fetchLikedPosts()]);
    setLoading(false);
  }, [userId, isLoaded, fetchProfile, fetchMyPosts, fetchLikedPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMyPosts(), fetchLikedPosts()]);
    setRefreshing(false);
  }, [fetchMyPosts, fetchLikedPosts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refetch posts only when the screen regains focus (e.g. after creating a
  // post) — not on the initial mount (loadData already handled that) and not on
  // every render. Skipping the first focus avoids a duplicate request on load.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      loadPostsOnly();
    }, [loadPostsOnly])
  );

  if (!isLoaded || loading) {
    return (
      <SafeAreaView className="flex-1 bg-bb-bg items-center justify-center">
        <ActivityIndicator color="#5A8B5F" size="large" />
      </SafeAreaView>
    );
  }

  const displayPosts = activeTab === "my" ? myPosts : likedPosts;

  const Header = () => (
    <View className="px-4 pb-4">
      {/* Avatar */}
      <View className="mb-6 items-center">
        <View className="relative mb-4">
          <View className="w-24 h-24 rounded-full border-4 border-bb-green items-center justify-center bg-bb-card overflow-hidden">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <Text className="text-bb-green text-4xl font-bold">
                {(user?.fullName || "C")[0].toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* Username */}
        <Text className="text-bb-text text-xl font-bold mb-1">
          @{user?.username || user?.fullName?.split(" ")[0]?.toLowerCase() || "climber"}
        </Text>

        {/* Grade & Video Count */}
        <Text className="text-bb-text-muted text-sm mb-3">
          {profile?.grade || "Beginner"} • {myPosts.length > 0 ? myPosts.length : "0"} Beta Videos
        </Text>

        {/* Bio */}
        {profile?.bio && (
          <Text className="text-bb-text text-center text-sm mb-4 px-4">
            {`"${profile.bio}"`}
          </Text>
        )}
      </View>

      {/* Edit Profile & Bookmark Buttons */}
      <View className="flex-row gap-3 mb-4">
        <Pressable className="flex-1 bg-bb-green rounded-full py-3 items-center justify-center">
          <Text className="text-white font-bold text-base">Edit Profile</Text>
        </Pressable>
        <Pressable className="px-4 py-3 border border-bb-green rounded-full items-center justify-center">
          <Feather name="bookmark" size={20} color="#5A8B5F" />
        </Pressable>
      </View>

      {/* Stats Row */}
      <View className="flex-row justify-around mb-6 px-2">
        <View className="items-center">
          <Text className="text-bb-text font-bold text-lg">
            {profile?.followers_count || 0}
          </Text>
          <Text className="text-bb-text-muted text-xs uppercase tracking-wider">
            Followers
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-bb-text font-bold text-lg">
            {profile?.following_count || 0}
          </Text>
          <Text className="text-bb-text-muted text-xs uppercase tracking-wider">
            Following
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-bb-text font-bold text-lg">
            {profile?.sends_count || 0}
          </Text>
          <Text className="text-bb-text-muted text-xs uppercase tracking-wider">
            Sends
          </Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View className="flex-row gap-0 border-b border-bb-card">
        <Pressable
          onPress={() => setActiveTab("my")}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === "my" ? "border-bb-green" : "border-transparent"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "my" ? "text-bb-green" : "text-bb-text-muted"
            }`}
          >
            My Videos
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("liked")}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === "liked" ? "border-bb-green" : "border-transparent"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "liked" ? "text-bb-green" : "text-bb-text-muted"
            }`}
          >
            Liked Videos
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <Feather name="film" size={40} color="#5A8B5F" />
      <Text className="text-bb-text-muted text-base mt-3 text-center">
        {activeTab === "my"
          ? "No videos yet.\nStart by uploading your first beta!"
          : "No liked videos yet.\nLike some posts to see them here."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-bb-bg" edges={["left", "right", "bottom"]}>
      <FlatList
        data={displayPosts}
        renderItem={({ item }) => <ProfileVideoGrid post={item} />}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 8 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 0, gap: 8 }}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5A8B5F"]}
            tintColor="#5A8B5F"
          />
        }
      />
    </SafeAreaView>
  );
}
