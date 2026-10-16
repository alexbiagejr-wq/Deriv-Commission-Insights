import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import {
  ActionButton,
  InlineMessage,
  PageHeader,
  Panel,
  StatusPill,
} from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme, setTheme, error: themeError } = useTheme();
  const { isReady, session, settings, saveSettings, disconnect } = useAuth();
  const [draft, setDraft] = useState<typeof settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const current = draft ?? settings;

  const edit = (field: keyof typeof settings, value: string) => {
    setDraft((previous) => ({ ...(previous ?? settings), [field]: value }));
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveSettings(current);
      setDraft(null);
      setMessage("Connection settings saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setMessage(
      "API token disconnected. The saved App ID remains on this device.",
    );
  };

  const handleThemeToggle = async () => {
    try {
      await setTheme(theme === "light" ? "dark" : "light");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save the appearance setting.",
      );
    }
  };

  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop:
            (insets.top || 0) + (typeof window !== "undefined" ? 67 : 8),
          paddingBottom:
            (insets.bottom || 0) + (typeof window !== "undefined" ? 34 : 100),
        },
      ]}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader
        eyebrow="PREFERENCES"
        title="Settings"
        subtitle="Manage your Deriv connection and permissions."
        trailing={
          <View style={styles.headerActions}>
            <StatusPill
              label={session ? "Account linked" : "No account"}
              tone={session ? "good" : "neutral"}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
              onPress={() => void handleThemeToggle()}
              style={({ pressed }) => [
                styles.themeToggle,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Feather
                name={theme === "light" ? "sun" : "moon"}
                size={18}
                color={colors.primary}
              />
            </Pressable>
          </View>
        }
      />
      {themeError ? (
        <InlineMessage tone="error">{themeError}</InlineMessage>
      ) : null}

      <Panel style={styles.connectionPanel}>
        <View style={styles.connectionTitleRow}>
          <View style={styles.connectionText}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>
              Deriv account
            </Text>
            <Text style={[styles.panelCopy, { color: colors.mutedForeground }]}>
              {session
                ? "Connected with an API token."
                : "Connect with a Deriv API token."}
            </Text>
          </View>
          {session ? (
            <Feather name="check-circle" size={21} color={colors.primary} />
          ) : (
            <Feather name="shield" size={21} color={colors.mutedForeground} />
          )}
        </View>
        {session ? (
          <>
            <InlineMessage tone="success">
              {Platform.OS === "web"
                ? "The token is held in memory for this web preview session only."
                : "The token is stored in this device’s secure storage. It is not sent to a project server."}
            </InlineMessage>
            <ActionButton
              label="Disconnect account"
              icon="log-out"
              variant="danger"
              onPress={() => void handleDisconnect()}
            />
          </>
        ) : null}
      </Panel>

      <Panel style={styles.settingsPanel}>
        <View style={styles.appIdHeading}>
          <View style={[styles.appIdIcon, { backgroundColor: colors.primary }]}>
            <Feather name="grid" size={19} color={colors.primaryForeground} />
          </View>
          <View style={styles.sectionHeading}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>
              Deriv App ID
            </Text>
            <Text style={[styles.panelCopy, { color: colors.mutedForeground }]}>
              The app used to connect to Deriv and load your reports.
            </Text>
          </View>
        </View>

        <Field
          label="Application ID"
          value={current.appId}
          placeholder="Your Deriv App ID"
          onChangeText={(value) => edit("appId", value)}
          colors={colors}
          prominent
        />
        {message ? (
          <InlineMessage tone={message.includes("saved") ? "success" : "error"}>
            {message}
          </InlineMessage>
        ) : null}

        <ActionButton
          label="Save settings"
          icon="save"
          onPress={() => void handleSave()}
          busy={saving}
        />

      </Panel>

      <Panel style={styles.permissionsPanel}>
        <View style={styles.permissionTitleRow}>
          <View
            style={[styles.permissionIcon, { backgroundColor: colors.accent }]}
          >
            <Feather
              name="bar-chart-2"
              size={18}
              color={colors.accentForeground}
            />
          </View>
          <View style={styles.permissionTitleCopy}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>
              Report access
            </Text>
            <Text style={[styles.panelCopy, { color: colors.mutedForeground }]}>
              Required for partner commissions and registered-app reports.
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.permissionBadge,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Feather name="check" size={14} color={colors.primary} />
          <Text
            style={[
              styles.permissionValue,
              { color: colors.secondaryForeground },
            ]}
          >
            application_read
          </Text>
          <Text
            style={[
              styles.permissionRequired,
              { color: colors.mutedForeground },
            ]}
          >
            REQUIRED
          </Text>
        </View>
        <Text style={[styles.panelCopy, { color: colors.mutedForeground }]}>
          This app only reads partner reports. It does not place trades.
        </Text>
      </Panel>
    </KeyboardAwareScrollViewCompat>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  colors,
  autoCapitalize = "none",
  prominent = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useColors>;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  prominent?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          prominent && styles.prominentInput,
          {
            backgroundColor: prominent ? colors.secondary : colors.background,
            borderColor: prominent ? colors.primary : colors.input,
            color: prominent ? colors.primary : colors.foreground,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16, flexGrow: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  connectionPanel: { gap: 15 },
  connectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  connectionText: { flex: 1, gap: 4 },
  panelTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  panelCopy: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  settingsPanel: { gap: 15 },
  sectionHeading: { gap: 5, marginBottom: 2 },
  appIdHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  appIdIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#176b4b",
  },
  field: { gap: 7 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  prominentInput: {
    minHeight: 56,
    borderWidth: 2,
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  permissionsPanel: { gap: 12 },
  permissionTitleRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionTitleCopy: { flex: 1, gap: 3 },
  permissionBadge: {
    alignSelf: "flex-start",
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    borderRadius: 11,
  },
  permissionValue: { fontFamily: "Inter_700Bold", fontSize: 12 },
  permissionRequired: {
    fontFamily: "Inter_700Bold",
    fontSize: 8,
    letterSpacing: 0.6,
  },
});
