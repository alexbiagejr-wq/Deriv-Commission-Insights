import React from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const CONTACT_PHONE = "254115335502";

function AppLogo() {
  return (
    <Svg width={21} height={21} viewBox="0 0 64 64">
      <Rect width="64" height="64" rx="19" fill="#10152D" />
      <Circle
        cx="32"
        cy="32"
        r="23"
        stroke="#353B62"
        strokeWidth="1.5"
        strokeDasharray="1 4"
      />
      <Path
        d="M14 45 27 19l8 16 13-19"
        stroke="#58E8E4"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m42 16 6-6 6 6"
        stroke="#B99BFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="14" cy="45" r="2.2" fill="#68F0CE" />
      <Circle cx="27" cy="19" r="2.2" fill="#62E5FF" />
      <Circle cx="35" cy="35" r="2.2" fill="#62E5FF" />
      <Circle cx="48" cy="16" r="2.2" fill="#BD9CFF" />
    </Svg>
  );
}

export function FloatingWhatsApp() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handlePress = async () => {
    const url = `https://wa.me/${CONTACT_PHONE}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not open WhatsApp.";
      Alert.alert("Could not open WhatsApp", message);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 16) + 96,
        },
      ]}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Contact us on WhatsApp"
        onPress={() => void handlePress()}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: "#25D366", opacity: pressed ? 0.82 : 1 },
        ]}
      >
        <FontAwesome name="whatsapp" size={29} color="#fff" />
        <View style={[styles.logoBadge, { borderColor: colors.card }]}>
          <AppLogo />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 18,
    zIndex: 1000,
    elevation: 12,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  logoBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 25,
    height: 25,
    borderWidth: 2,
    borderRadius: 9,
    overflow: "hidden",
    backgroundColor: "#10152D",
    alignItems: "center",
    justifyContent: "center",
  },
});
