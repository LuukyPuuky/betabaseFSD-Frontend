import { useIsFocused } from "@react-navigation/native";
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

const PAGE_SIZE = 6;

export default function Home() {
  const supabase = useSupabase();

  // Tab navigators keep this screen mounted when you switch tabs. Track focus
  // so the active card pauses when Home isn't the visible tab.
  const isFocused = useIsFocused();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [itemHeight, setItemHeight] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);

  const loadPage = useCallback(
    async (page: number) => {
      if (fetchingRef.current || !hasMoreRef.current) return;
      fetchingRef.current = true;
      if (page > 0) setLoadingMore(true);

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!error && data) {
        if (data.length < PAGE_SIZE) hasMoreRef.current = false;
        pageRef.current = page;

        if (page === 0) {
          setPosts(data);
          if (data.length > 0) setActiveId(data[0].id.toString());
        } else {
          // Dedupe by id in case a newly-inserted post shifted the window.
          setPosts((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...data.filter((p) => !seen.has(p.id))];
          });
        }
      }

      fetchingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    },
    [supabase],
  );

  useEffect(() => {
    loadPage(0);
  }, [loadPage]);

  const onEndReached = useCallback(() => {
    loadPage(pageRef.current + 1);
  }, [loadPage]);

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
          onEndReached={onEndReached}
          onEndReachedThreshold={1}
          extraData={`${activeId}:${isFocused}`}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
          ListFooterComponent={
            loadingMore ? (
              <View
                style={{ height: itemHeight }}
                className="items-center justify-center bg-black"
              >
                <ActivityIndicator color="#fff" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <FeedCard
              item={item}
              active={isFocused && item.id.toString() === activeId}
              height={itemHeight}
            />
          )}
        />
      )}
    </View>
  );
}
