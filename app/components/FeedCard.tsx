import { useAuth } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useEvent } from "expo";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  GestureResponderEvent,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSupabase } from "@/lib/supabase";
import { formatDuration } from "@/lib/format";
import { colorForUserId } from "@/lib/noteColors";
import { findNoteCrossedAt } from "@/lib/noteTiming";

type FeedPost = {
  id: string;
  gym_name: string;
  grade: string | number;
  climbing_style: string;
  description: string;
  video_url: string;
  user_id: string;
};

type NoteAuthor = {
  username: string | null;
  avatar_url: string | null;
};

type PostNote = {
  id: string;
  post_id: string;
  user_id: string;
  timestamp_seconds: number;
  body: string;
  created_at?: string;
  author?: NoteAuthor | null;
};

type FeedCardProps = {
  item: FeedPost;
  active: boolean;
  /** Full-screen height for this card. Falls back to the window height. */
  height?: number;
};

const NOTE_AUTO_DISMISS_MS = 4000;

function initialsFor(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export default function FeedCard({ item, active, height }: FeedCardProps) {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();

  const cardHeight = height ?? Dimensions.get("window").height;
  const isOwnPost = !!userId && userId === item.user_id;

  // --- Author ---
  const [author, setAuthor] = useState<NoteAuthor | null>(null);

  // --- Notes ---
  const [notes, setNotes] = useState<PostNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<PostNote | null>(null);

  // --- Likes / Follow ---
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);

  // --- Playback ---
  const [isPlaying, setIsPlaying] = useState(active);
  const [barWidth, setBarWidth] = useState(0);

  // --- Note composer ---
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftBody, setDraftBody] = useState("");
  const [draftTime, setDraftTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const prevTimeRef = useRef(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(item.video_url, (p) => {
    p.loop = true;
    p.muted = false;
    p.timeUpdateEventInterval = 0.25;
  });

  // Re-render on playback ticks and load so currentTime / duration stay fresh.
  const timeUpdate = useEvent(player, "timeUpdate");
  useEvent(player, "statusChange");

  const currentTime = timeUpdate?.currentTime ?? player.currentTime;
  const duration = player.duration;
  const progress = clamp01(duration > 0 ? currentTime / duration : 0);

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

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchAuthor = useCallback(async () => {
    if (!item.user_id) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", item.user_id)
      .single();
    if (!error && data) setAuthor(data as NoteAuthor);
  }, [supabase, item.user_id]);

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("post_notes")
      .select("*, author:profiles(username, avatar_url)")
      .eq("post_id", item.id)
      .order("timestamp_seconds", { ascending: true });
    if (!error && data) setNotes(data as PostNote[]);
  }, [supabase, item.id]);

  const fetchLikes = useCallback(async () => {
    const { data, error } = await supabase
      .from("post_likes")
      .select("user_id")
      .eq("post_id", item.id);
    if (!error && data) {
      setLikeCount(data.length);
      setLiked(userId ? data.some((l: any) => l.user_id === userId) : false);
    }
  }, [supabase, item.id, userId]);

  const fetchFollow = useCallback(async () => {
    if (!userId || isOwnPost) return;
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", userId)
      .eq("following_id", item.user_id);
    if (!error && data) setFollowing(data.length > 0);
  }, [supabase, userId, item.user_id, isOwnPost]);

  useEffect(() => {
    fetchAuthor();
    fetchNotes();
    fetchLikes();
    fetchFollow();
  }, [fetchAuthor, fetchNotes, fetchLikes, fetchFollow]);

  // ---------------------------------------------------------------------------
  // Note popover (manual + timed auto-reveal)
  // ---------------------------------------------------------------------------
  const clearDismissTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const showNote = useCallback(
    (note: PostNote, autoDismiss: boolean) => {
      clearDismissTimer();
      setSelectedNote(note);
      if (autoDismiss) {
        dismissTimer.current = setTimeout(
          () => setSelectedNote(null),
          NOTE_AUTO_DISMISS_MS,
        );
      }
    },
    [clearDismissTimer],
  );

  const dismissNote = useCallback(() => {
    clearDismissTimer();
    setSelectedNote(null);
  }, [clearDismissTimer]);

  useEffect(() => clearDismissTimer, [clearDismissTimer]);

  // Auto-reveal a note's bubble when playback reaches its timestamp.
  useEffect(() => {
    const prev = prevTimeRef.current;
    prevTimeRef.current = currentTime;
    if (!isPlaying || composerOpen) return;
    const crossed = findNoteCrossedAt(notes, prev, currentTime);
    if (crossed) showNote(crossed, true);
  }, [currentTime, isPlaying, composerOpen, notes, showNote]);

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------
  const tapHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const seekTo = useCallback(
    (seconds: number) => {
      if (duration > 0) {
        player.currentTime = Math.max(0, Math.min(seconds, duration));
        prevTimeRef.current = player.currentTime;
      }
    },
    [player, duration],
  );

  const onScrub = useCallback(
    (e: GestureResponderEvent) => {
      if (barWidth <= 0 || duration <= 0) return;
      const ratio = clamp01(e.nativeEvent.locationX / barWidth);
      seekTo(ratio * duration);
    },
    [barWidth, duration, seekTo],
  );

  const onShare = useCallback(async () => {
    tapHaptic();
    const name = author?.username || "Climber";
    try {
      await Share.share({
        message: `${name}'s beta — ${item.gym_name} (${item.grade})\n${item.video_url}`,
        url: item.video_url,
      });
    } catch {
      // user dismissed the share sheet
    }
  }, [author, item.gym_name, item.grade, item.video_url, tapHaptic]);

  const toggleLike = useCallback(async () => {
    if (!userId) return;
    const next = !liked;
    // Optimistic
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    tapHaptic();

    const { error } = next
      ? await supabase
          .from("post_likes")
          .insert({ user_id: userId, post_id: item.id })
      : await supabase
          .from("post_likes")
          .delete()
          .eq("user_id", userId)
          .eq("post_id", item.id);

    if (error) {
      // Revert
      setLiked(!next);
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
    }
  }, [userId, liked, supabase, item.id, tapHaptic]);

  const toggleFollow = useCallback(async () => {
    if (!userId || isOwnPost) return;
    const next = !following;
    setFollowing(next);
    tapHaptic();

    const { error } = next
      ? await supabase
          .from("follows")
          .insert({ follower_id: userId, following_id: item.user_id })
      : await supabase
          .from("follows")
          .delete()
          .eq("follower_id", userId)
          .eq("following_id", item.user_id);

    if (error) setFollowing(!next);
  }, [userId, isOwnPost, following, supabase, item.user_id, tapHaptic]);

  const openComposer = useCallback(() => {
    setDraftTime(player.currentTime || 0);
    setDraftBody("");
    setIsPlaying(false);
    setComposerOpen(true);
  }, [player]);

  const submitNote = useCallback(async () => {
    const body = draftBody.trim();
    if (!userId || !body || submitting) return;
    setSubmitting(true);
    tapHaptic();

    const { error } = await supabase.from("post_notes").insert({
      post_id: item.id,
      user_id: userId,
      timestamp_seconds: draftTime,
      body,
    });

    setSubmitting(false);
    if (!error) {
      setComposerOpen(false);
      setDraftBody("");
      await fetchNotes();
    }
  }, [
    draftBody,
    userId,
    submitting,
    supabase,
    item.id,
    draftTime,
    fetchNotes,
    tapHaptic,
  ]);

  const onMarkerPress = useCallback(
    (note: PostNote) => {
      seekTo(note.timestamp_seconds);
      showNote(note, false);
    },
    [seekTo, showNote],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const authorName = author?.username || "Climber";
  const avatarColor = colorForUserId(item.user_id);
  const selectedColor = selectedNote
    ? colorForUserId(selectedNote.user_id)
    : "#ffffff";

  return (
    <View style={{ height: cardHeight }} testID="feed-card">
      {/* Full-bleed video background */}
      <VideoView
        player={player}
        style={{ position: "absolute", width: "100%", height: "100%" }}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Play/Pause tap layer */}
      <Pressable
        onPress={() => setIsPlaying((p) => !p)}
        className="absolute inset-0 items-center justify-center"
      >
        {!isPlaying && (
          <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center">
            <Feather name="play" size={28} color="#fff" />
          </View>
        )}
      </Pressable>

      {/* Header overlay */}
      <View
        className="absolute top-0 left-0 right-0 flex-row items-center px-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3 overflow-hidden"
          style={{ backgroundColor: avatarColor }}
        >
          {author?.avatar_url ? (
            <Image
              source={{ uri: author.avatar_url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <Text className="text-white text-sm font-bold">
              {initialsFor(authorName)}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <Text
            className="text-white font-semibold text-sm"
            style={{ textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 4 }}
            testID="feed-author-name"
          >
            {authorName}
          </Text>
          <Text
            className="text-white/80 text-xs mt-0.5"
            style={{ textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 4 }}
            numberOfLines={1}
          >
            {item.gym_name} • {item.grade}
          </Text>
        </View>

        {!isOwnPost && (
          <Pressable
            onPress={toggleFollow}
            testID="follow-button"
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
        )}
      </View>

      {/* Note popover */}
      {selectedNote && (
        <>
          <Pressable
            testID="note-popover-backdrop"
            onPress={dismissNote}
            className="absolute inset-0"
          />
          <View
            testID="note-popover"
            className="absolute left-4 right-4 bottom-36 rounded-xl bg-black/80 px-4 py-3"
            style={{ borderLeftWidth: 3, borderLeftColor: selectedColor }}
          >
            <Text className="text-white text-sm font-semibold">
              {selectedNote.body}
            </Text>
            <Text className="text-white/60 text-xs mt-0.5">
              {selectedNote.author?.username || "Climber"} •{" "}
              {formatDuration(selectedNote.timestamp_seconds)}
            </Text>
          </View>
        </>
      )}

      {/* Bottom controls overlay */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8">
        {/* Timeline (SoundCloud-style) */}
        <Pressable
          testID="progress-bar"
          onPress={onScrub}
          onLayout={(e: LayoutChangeEvent) =>
            setBarWidth(e.nativeEvent.layout.width)
          }
          className="h-4 justify-center mb-1"
        >
          <View className="h-1 bg-white/30 rounded-full w-full">
            <View
              className="h-1 bg-bb-green rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
            {duration > 0 &&
              notes.map((note) => (
                <Pressable
                  key={note.id}
                  testID={`note-marker-${note.id}`}
                  onPress={() => onMarkerPress(note)}
                  className="absolute w-3 h-3 rounded-full -mt-1"
                  style={{
                    left: `${clamp01(note.timestamp_seconds / duration) * 100}%`,
                    marginLeft: -6,
                    backgroundColor: colorForUserId(note.user_id),
                  }}
                />
              ))}
          </View>
        </Pressable>
        <Text
          className="text-white text-xs mb-3"
          style={{ textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 4 }}
        >
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </Text>

        {/* Action row */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-5">
            <Pressable
              onPress={toggleLike}
              testID="like-button"
              className="flex-row items-center gap-1.5"
            >
              <Feather
                name="heart"
                size={24}
                color={liked ? "#ef4444" : "#ffffff"}
              />
              <Text
                className="text-white text-sm"
                style={{
                  textShadowColor: "rgba(0,0,0,0.6)",
                  textShadowRadius: 4,
                }}
                testID="like-count"
              >
                {formatCount(likeCount)}
              </Text>
            </Pressable>

            <Pressable onPress={onShare} testID="share-button">
              <Feather name="share-2" size={24} color="#ffffff" />
            </Pressable>
          </View>

          <Pressable
            onPress={openComposer}
            testID="add-note-button"
            className="flex-row items-center gap-1.5 bg-bb-green rounded-full px-4 py-2"
          >
            <Feather name="edit-2" size={14} color="#ffffff" />
            <Text className="text-white text-xs font-semibold">Add Note</Text>
          </Pressable>
        </View>
      </View>

      {/* Note Composer Modal */}
      <Modal visible={composerOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <Pressable
            className="flex-1 justify-end bg-black/60"
            onPress={() => setComposerOpen(false)}
          >
            <Pressable
              className="bg-bb-card rounded-t-3xl w-full px-5 pt-5 pb-8"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white font-bold text-lg">Add Beta Note</Text>
                <Pressable
                  onPress={() => setComposerOpen(false)}
                  testID="note-composer-close"
                >
                  <Feather name="x" size={22} color="#9CA3AF" />
                </Pressable>
              </View>

              <View className="flex-row items-center gap-2 mb-3">
                <Feather name="clock" size={14} color="#5A8B5F" />
                <Text className="text-bb-text-muted text-sm">
                  Pinned at {formatDuration(draftTime)}
                </Text>
              </View>

              <View className="bg-bb-bg rounded-2xl px-4 py-3 min-h-[90px] mb-4">
                <TextInput
                  testID="note-composer-input"
                  className="flex-1 text-white text-base"
                  placeholder="Share your beta for this moment..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  autoFocus
                  value={draftBody}
                  onChangeText={setDraftBody}
                />
              </View>

              <Pressable
                onPress={submitNote}
                disabled={submitting || draftBody.trim().length === 0}
                testID="note-composer-submit"
                className={`bg-bb-green rounded-full py-3.5 items-center ${
                  submitting || draftBody.trim().length === 0
                    ? "opacity-50"
                    : ""
                }`}
              >
                <Text className="text-white font-bold text-base">
                  {submitting ? "Posting..." : "Post Note"}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
