import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FeedCard from "@/app/components/FeedCard";
import { useSupabase } from "@/lib/supabase";

export default function Home() {
  const supabase = useSupabase();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPosts(data);
      }

      setLoading(false);
    };

    fetchPosts();
  }, [supabase]);

  if (loading) {
    return (
      <View className="flex-1 bg-bb-bg items-center justify-center">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bb-bg">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 16 }}
        renderItem={({ item }) => <FeedCard item={item} active={true} />}
      />
    </SafeAreaView>
  );
}
