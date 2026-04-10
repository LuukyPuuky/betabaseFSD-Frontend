import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

// Boulder Font grades commonly used in the Netherlands
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
  const [gym, setGym] = useState("");
  const [description, setDescription] = useState("");

  const [grade, setGrade] = useState("Select Grade");
  const [showGradeModal, setShowGradeModal] = useState(false);

  const [style, setStyle] = useState("Dynamic");
  const [showStyleModal, setShowStyleModal] = useState(false);

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
          <Pressable className="p-2 -mr-2">
            <Text className="text-bb-green font-bold">Drafts</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 pb-12"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Upload Video Area */}
          <Pressable className="mt-4 border-2 border-dashed border-[#2A3F2D] rounded-3xl py-12 items-center bg-[#1a211a]">
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

          {/* Form Fields container */}
          <View className="mt-8">
            {/* Gym Location */}
            <View className="mb-6">
              <Text className="text-white font-bold text-sm mb-2">
                Gym Location
              </Text>
              <View className="bg-bb-card flex-row items-center rounded-2xl border border-transparent px-4 py-3.5 focus:border-bb-green">
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

            {/* Grade & Style Grids */}
            <View className="flex-row gap-4 mb-6">
              {/* Grade */}
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

              {/* Style */}
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

            {/* Route Description */}
            <View className="mb-6">
              <Text className="text-white font-bold text-sm mb-2">
                Route Description
              </Text>
              <View className="bg-bb-card rounded-2xl border border-transparent px-4 py-3.5 min-h-[120px] focus:border-bb-green">
                <TextInput
                  className="flex-1 text-white text-base"
                  placeholder="Share your beta secrets, specific holds, or crux tips..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>
          </View>

          {/* Submit Action */}
          <Pressable className="bg-bb-green flex-row items-center justify-center rounded-full py-4 mt-2 shadow-sm">
            <Feather
              name="upload-cloud"
              size={20}
              color="#ffffff"
              className="mr-2"
            />
            <Text className="text-white font-bold text-[17px]">
              Post to BoulderBase
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Grade Selector Modal */}
      <Modal visible={showGradeModal} transparent animationType="fade">
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setShowGradeModal(false)}
        >
          <View className="bg-bb-card rounded-t-3xl max-h-[60%] w-full overflow-hidden">
            <View className="py-4 border-b border-[#1a1a1a] items-center">
              <View className="w-12 h-1 bg-bb-text-muted rounded-full mb-3" />
              <Text className="text-white font-bold text-lg">Select Grade</Text>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {GRADES.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => {
                    setGrade(g);
                    setShowGradeModal(false);
                  }}
                  className={`p-4 border-b border-[#1a1a1a] items-center ${grade === g ? "bg-bb-green/20" : ""}`}
                >
                  <Text
                    className={`text-base ${grade === g ? "text-bb-green font-bold" : "text-white"}`}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Style Selector Modal */}
      <Modal visible={showStyleModal} transparent animationType="fade">
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setShowStyleModal(false)}
        >
          <View className="bg-bb-card rounded-t-3xl max-h-[50%] w-full overflow-hidden">
            <View className="py-4 border-b border-[#1a1a1a] items-center">
              <View className="w-12 h-1 bg-bb-text-muted rounded-full mb-3" />
              <Text className="text-white font-bold text-lg">Select Style</Text>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {STYLES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    setStyle(s);
                    setShowStyleModal(false);
                  }}
                  className={`p-4 border-b border-[#1a1a1a] items-center ${style === s ? "bg-bb-green/20" : ""}`}
                >
                  <Text
                    className={`text-base ${style === s ? "text-bb-green font-bold" : "text-white"}`}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
