import { useAuth } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- SUPABASE CONFIG ---
// Import your supabase client from your config file
import { supabaseAnonKey, supabaseUrl, useSupabase } from "../../lib/supabase";

const GRADES = [
  "3",
  "4",
  "4+",
  "5",
  "5+",
  "6A",
  "6A+",
  "6B",
  "6B+",
  "6C",
  "6C+",
  "7A",
  "7A+",
  "7B",
  "7B+",
  "7C",
  "7C+",
  "8A",
  "8A+",
  "8B",
];
const STYLES = ["Dynamic", "Static", "Crimp", "Slab", "Sloper"];

export default function Create() {
  const router = useRouter();
  const supabase = useSupabase();
  const { userId, getToken } = useAuth();

  // Form State
  const [gym, setGym] = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState("Select Grade");
  const [style, setStyle] = useState("Dynamic");

  // Media State
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusLabel, setStatusLabel] = useState("");

  // UI State
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);

  // 1. Pick Video Function
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setVideo(asset);

    // Generate a still preview from the local file. We deliberately never play
    // the video on this screen — autoplaying a freshly-picked clip here crashed
    // the app. The real video is only rendered in the feed after the post is
    // saved. This thumbnail is also reused at upload time (no regeneration).
    setThumbnailUri(null);
    setThumbnailLoading(true);
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
        time: 0,
        quality: 0.5,
      });
      setThumbnailUri(uri);
    } catch (err) {
      console.warn("⚠️ Preview thumbnail generation failed:", err);
    } finally {
      setThumbnailLoading(false);
    }
  };

  const clearVideo = () => {
    setVideo(null);
    setThumbnailUri(null);
  };

  // 2. Handle Final Submit
  const handlePost = async () => {
    if (!video || grade === "Select Grade" || !gym) {
      Alert.alert("Missing info", "Please select a video, gym, and grade.");
      return;
    }

    setUploading(true);

    try {
      // Step 1: Verify auth
      if (!userId) {
        throw new Error("Not authenticated. Please log in.");
      }

      // Step 2: Auth token used by Storage RLS (Clerk JWT, same as the client).
      const token = await getToken({ template: "supabase" });

      // Stream a local file straight to Supabase Storage from disk. We do NOT
      // read the file into a JS ArrayBuffer first — loading a full-quality video
      // into memory and POSTing it as a single body is what caused the
      // "Network request failed" error on device. expo-file-system streams it.
      const uploadToStorage = async (
        localUri: string,
        objectPath: string,
        contentType: string,
      ) => {
        if (Platform.OS === "web") {
          // expo-file-system upload is unavailable on web — fall back to the SDK.
          const buffer = await fetch(localUri).then((r) => r.arrayBuffer());
          const { error } = await supabase.storage
            .from("videoStorage")
            .upload(objectPath, buffer, { contentType, upsert: false });
          if (error) throw error;
          return;
        }

        const res = await FileSystem.uploadAsync(
          `${supabaseUrl}/storage/v1/object/videoStorage/${objectPath}`,
          localUri,
          {
            httpMethod: "POST",
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: {
              Authorization: `Bearer ${token ?? supabaseAnonKey}`,
              apikey: supabaseAnonKey ?? "",
              "Content-Type": contentType,
              "x-upsert": "false",
            },
          },
        );

        if (res.status < 200 || res.status >= 300) {
          throw new Error(
            `Storage upload failed (HTTP ${res.status}): ${
              res.body || "no response body"
            }`,
          );
        }
      };

      // Step 3: Compress so the clip fits Storage limits (Free plan ~50 MB),
      // then upload the compressed file (streamed from disk). Compression is a
      // native module, so skip it on web and upload the original there.
      let uploadUri = video.uri;
      if (Platform.OS !== "web") {
        try {
          // Imported lazily: react-native-compressor is a native module, so a
          // build that doesn't yet include it must NOT crash the screen at load
          // time. If it's unavailable we fall back to uploading the original.
          const { Video } = await import("react-native-compressor");
          setStatusLabel("Compressing…");
          uploadUri = await Video.compress(
            video.uri,
            { compressionMethod: "auto" },
            (progress) =>
              setStatusLabel(`Compressing ${Math.round(progress * 100)}%`),
          );
        } catch (compressErr) {
          console.warn(
            "⚠️ Video compression unavailable — uploading the original. " +
              "Rebuild the dev client (npx expo run:android) to enable it.",
            compressErr,
          );
          setStatusLabel("");
        }
      }

      // The compressor always outputs an mp4, regardless of the source container.
      const fileName = `${userId}/${Date.now()}.mp4`;

      setStatusLabel("Uploading…");
      console.log(`📤 Uploading video to storage: ${fileName}`);
      await uploadToStorage(uploadUri, fileName, "video/mp4");
      console.log("✅ Storage upload successful");

      // Step 4: Public URL (string-only, no network call)
      const videoUrl = supabase.storage
        .from("videoStorage")
        .getPublicUrl(fileName).data.publicUrl;
      console.log(`✅ Video URL: ${videoUrl}`);

      let thumbnailUrl: string | null = null;
      try {
        // Reuse the preview generated when the video was picked; only generate
        // here as a fallback if it is somehow missing.
        let thumbUri = thumbnailUri;
        if (!thumbUri) {
          const generated = await VideoThumbnails.getThumbnailAsync(video.uri, {
            time: 0,
            quality: 0.5,
          });
          thumbUri = generated.uri;
        }
        const thumbName = `${userId}/${Date.now()}_thumb.jpg`;
        await uploadToStorage(thumbUri, thumbName, "image/jpeg");
        thumbnailUrl = supabase.storage
          .from("videoStorage")
          .getPublicUrl(thumbName).data.publicUrl;
        console.log(`✅ Thumbnail URL: ${thumbnailUrl}`);
      } catch (thumbErr) {
        console.warn("⚠️ Thumbnail generation failed:", thumbErr);
      }

      // Step 6: Save post to database
      console.log("📝 Saving post to database...");
      const postData = {
        gym_name: gym,
        grade: grade,
        climbing_style: style,
        description: description || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        user_id: userId,
        created_at: new Date().toISOString(),
        view_count: 0,
      };

      const { error: dbError } = await supabase
        .from("posts")
        .insert([postData]);

      if (dbError) {
        console.error("❌ Database error:", dbError.message);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log("✅ Post saved to database");

      Alert.alert("Success! 🎉", "Your climbing beta has been posted!");
      router.back();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Upload error:", errorMessage);
      Alert.alert("Upload Failed", errorMessage);
    } finally {
      setUploading(false);
      setStatusLabel("");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bb-bg" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Feather name="x" size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Upload Beta</Text>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1 px-6 pb-12"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Upload Video Area */}
          {video ? (
            <View className="mt-4 rounded-3xl overflow-hidden bg-[#1a211a] border border-[#2A3F2D]">
              {/* Still preview — never an autoplaying video on this screen */}
              <View className="relative w-full h-[200px] bg-black">
                {thumbnailUri ? (
                  <Image
                    source={{ uri: thumbnailUri }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : thumbnailLoading ? (
                  <View className="w-full h-full items-center justify-center">
                    <ActivityIndicator color="#5A8B5F" />
                  </View>
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Feather name="film" size={28} color="#5A8B5F" />
                  </View>
                )}

                {/* Play badge signals this is a video clip, not a photo */}
                <View className="absolute inset-0 items-center justify-center">
                  <View className="w-12 h-12 rounded-full bg-black/40 items-center justify-center">
                    <Feather name="play" size={22} color="#ffffff" />
                  </View>
                </View>
              </View>

              {/* Change / Remove actions */}
              <View className="flex-row gap-3 p-3">
                <Pressable
                  onPress={pickVideo}
                  className="flex-1 flex-row items-center justify-center gap-2 bg-bb-green rounded-full py-3"
                >
                  <Feather name="refresh-cw" size={16} color="#ffffff" />
                  <Text className="text-white font-bold text-[15px]">
                    Change video
                  </Text>
                </Pressable>
                <Pressable
                  onPress={clearVideo}
                  className="flex-row items-center justify-center gap-2 bg-bb-card border border-[#2A3F2D] rounded-full px-5 py-3"
                >
                  <Feather name="trash-2" size={16} color="#9CA3AF" />
                  <Text className="text-bb-text-muted font-semibold text-[15px]">
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={pickVideo}
              className="mt-4 border-2 border-dashed border-[#2A3F2D] rounded-3xl overflow-hidden min-h-[200px] items-center justify-center bg-[#1a211a]"
            >
              <View className="w-12 h-12 rounded-full bg-[#2A3F2D] items-center justify-center mb-4">
                <Feather name="film" size={20} color="#5A8B5F" />
              </View>
              <Text className="text-white font-bold text-lg mb-1">
                Select Video
              </Text>
              <Text className="text-bb-text-muted text-sm mb-6">
                Tap to browse your climbing clips
              </Text>
              <View className="bg-bb-green px-6 py-3 rounded-full">
                <Text className="text-white font-bold text-[15px]">
                  Open Gallery
                </Text>
              </View>
            </Pressable>
          )}

          {/* Form Fields */}
          <View className="mt-8">
            <View className="mb-6">
              <Text className="text-white font-bold text-sm mb-2">
                Gym Location
              </Text>
              <View className="bg-bb-card flex-row items-center rounded-2xl border border-transparent px-4 py-3.5">
                <Feather name="map-pin" size={18} color="#9CA3AF" />
                <TextInput
                  className="flex-1 text-white ml-3 text-base"
                  placeholder="Search for a gym..."
                  placeholderTextColor="#9CA3AF"
                  value={gym}
                  onChangeText={setGym}
                />
              </View>
            </View>

            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Text className="text-white font-bold text-sm mb-2">Grade</Text>
                <Pressable
                  onPress={() => setShowGradeModal(true)}
                  className="bg-bb-card flex-row items-center justify-between rounded-2xl px-4 py-3.5"
                >
                  <Text
                    className={`text-base ${grade === "Select Grade" ? "text-bb-text-muted" : "text-white"}`}
                  >
                    {grade}
                  </Text>
                  <Feather name="chevron-down" size={18} color="#9CA3AF" />
                </Pressable>
              </View>

              <View className="flex-1">
                <Text className="text-white font-bold text-sm mb-2">Style</Text>
                <Pressable
                  onPress={() => setShowStyleModal(true)}
                  className="bg-bb-card flex-row items-center justify-between rounded-2xl px-4 py-3.5"
                >
                  <Text className="text-white text-base">{style}</Text>
                  <Feather name="chevron-down" size={18} color="#9CA3AF" />
                </Pressable>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-white font-bold text-sm mb-2">
                Description
              </Text>
              <View className="bg-bb-card rounded-2xl px-4 py-3.5 min-h-[120px]">
                <TextInput
                  className="flex-1 text-white text-base"
                  placeholder="Share your beta secrets..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>
          </View>

          {/* Submit Action */}
          <Pressable
            onPress={handlePost}
            disabled={uploading}
            className={`bg-bb-green flex-row items-center justify-center rounded-full py-4 mt-2 shadow-sm ${uploading ? "opacity-50" : ""}`}
          >
            {uploading ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="#fff" />
                {statusLabel ? (
                  <Text className="text-white font-bold text-[15px]">
                    {statusLabel}
                  </Text>
                ) : null}
              </View>
            ) : (
              <>
                <Feather
                  name="upload-cloud"
                  size={20}
                  color="#ffffff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-[17px]">
                  Post to BetaBase
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Grade Selector Modal (Existing logic) */}
      <Modal visible={showGradeModal} transparent animationType="slide">
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setShowGradeModal(false)}
        >
          <View className="bg-bb-card rounded-t-3xl max-h-[60%] w-full overflow-hidden">
            <ScrollView>
              {GRADES.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => {
                    setGrade(g);
                    setShowGradeModal(false);
                  }}
                  className="p-4 border-b border-[#1a1a1a] items-center"
                >
                  <Text className="text-white text-base">{g}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Style Selector Modal (Existing logic) */}
      <Modal visible={showStyleModal} transparent animationType="slide">
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setShowStyleModal(false)}
        >
          <View className="bg-bb-card rounded-t-3xl max-h-[50%] w-full overflow-hidden">
            <ScrollView>
              {STYLES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    setStyle(s);
                    setShowStyleModal(false);
                  }}
                  className="p-4 border-b border-[#1a1a1a] items-center"
                >
                  <Text className="text-white text-base">{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
