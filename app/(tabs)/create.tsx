import { Feather } from "@expo/vector-icons";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
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
import uuid from "react-native-uuid";

// --- SUPABASE CONFIG ---
// Import your supabase client from your config file
import { useSupabase } from "../../lib/supabase";

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

  // Form State
  const [gym, setGym] = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState("Select Grade");
  const [style, setStyle] = useState("Dynamic");

  // Media State
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null); // Stores the selected video object
  const [uploading, setUploading] = useState(false);

  // UI State
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);

  // 1. Pick Video Function
  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideo(result.assets[0]);
    }
  };

  // 2. Handle Final Submit
  const handlePost = async () => {
    if (!video || grade === "Select Grade" || !gym) {
      Alert.alert("Missing info", "Please select a video, gym, and grade.");
      return;
    }

    setUploading(true);

    try {
      // A. Convert URI to Blob
      const response = await fetch(video.uri);
      const blob = await response.blob();

      const fileExt = video.uri.split(".").pop();
      const fileName = `${uuid.v4()}.${fileExt}`;
      const filePath = `${fileName}`;

      // B. Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from("videoStorage")
        .upload(filePath, blob, {
          contentType: "video/mp4",
        });

      if (storageError) throw storageError;

      // C. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("videoStorage").getPublicUrl(filePath);

      // D. Save to Database
      const { error: dbError } = await supabase
        .from("posts") // Ensure this table has these columns
        .insert({
          gym_name: gym,
          grade: grade,
          climbing_style: style,
          description: description,
          video_url: publicUrl,
          created_at: new Date(),
        });

      if (dbError) throw dbError;

      Alert.alert("Success!", "Your beta has been uploaded.");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Upload failed", (error as Error).message);
    } finally {
      setUploading(false);
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
          <Pressable
            onPress={pickVideo}
            className="mt-4 border-2 border-dashed border-[#2A3F2D] rounded-3xl overflow-hidden min-h-[200px] items-center justify-center bg-[#1a211a]"
          >
            {video ? (
              <Video
                source={{ uri: video.uri }}
                style={{ width: "100%", height: 200 }}
                isMuted
                shouldPlay
                isLooping
              />
            ) : (
              <>
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
              </>
            )}
          </Pressable>

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
                Route Description
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
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather
                  name="upload-cloud"
                  size={20}
                  color="#ffffff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-[17px]">
                  Post to BoulderBase
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
