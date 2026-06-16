import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  View,
  ViewToken,
} from "react-native";

import FeedCard from "@/app/components/FeedCard";
import { useSupabase } from "@/lib/supabase";

export default function Home() {
  const supabase = useSupabase();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemHeight, setItemHeight] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPosts(data);
        if (data.length > 0) {
          setActiveId(data[0].id.toString());
        }
      }

      setLoading(false);
    };

    fetchPosts();
  }, [supabase]);

  // Only the card that is >=80% on screen plays; the rest pause.
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveId(viewableItems[0].item.id.toString());
      }
    },
  ).current;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setItemHeight(e.nativeEvent.layout.height);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-bb-bg items-center justify-center">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black" onLayout={onLayout} testID="feed-pager">
      {itemHeight > 0 && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          pagingEnabled
          snapToInterval={itemHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          renderItem={({ item }) => (
            <FeedCard
              item={item}
              active={item.id.toString() === activeId}
              height={itemHeight}
            />
          )}
        />
      )}
    </View>
  );
}
