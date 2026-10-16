import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ActionButton, InlineMessage, PageHeader, Panel, StatusPill } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { useLiveAccount } from '@/lib/live-account';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    isReady,
    session,
    settings,
    saveSettings,
    disconnect,
  } = useAuth();
  const { status } = useLiveAccount();
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
      setMessage('Connection settings saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setMessage('Deriv account disconnected. The saved App ID and OAuth settings remain on this device.');
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
            (insets.top || 0) + (typeof window !== 'undefined' ? 67 : 8),
          paddingBottom:
            (insets.bottom || 0) + (typeof window !== 'undefined' ? 34 : 100),
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
          <StatusPill
            label={session ? 'Account linked' : 'No account'}
            tone={session ? 'good' : 'neutral'}
          />
        }
      />

      <Panel style={styles.connectionPanel}>
        <View style={styles.connectionTitleRow}>
          <View style={styles.connectionText}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>
              Deriv account
            </Text>
            <Text style={[styles.panelCopy, { color: colors.mutedForeground }]}>
              {session
                ? `Connected with ${session.method === 'pat' ? 'a personal token' : 'Deriv OAuth'}.`
                : 'Choose a personal token or sign in with Deriv.'}
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
              {Platform.OS === 'web'
                ? 'The token is held in memory for this web preview session only.'
                : 'The token is stored in this device’s secure storage. It is not sent to a project server.'}
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
        <View style={styles.sectionHeading}>
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>
            API settings
          </Text>
          <Text style={[styles.panelCopy, { color: colors.mutedForeground }]}>
            The App ID is public configuration. OAuth values must match the app registered with Deriv.
          </Text>
        </View>

        <Field
          label="Deriv App ID"
          value={current.appId}
          placeholder="Your Deriv App ID"
          onChangeText={(value) => edit('appId', value)}
          colors={colors}
        />
        <Field
          label="OAuth Client ID"
          value={current.oauthClientId}
          placeholder="Registered OAuth client"
          onChangeText={(value) => edit('oauthClientId', value)}
          colors={colors}
        />
        <Field
          label="Registered redirect URL"
          value={current.redirectUri}
          placeholder="deriv-commission-insights://oauth"
          onChangeText={(value) => edit('redirectUri', value)}
          colors={colors}
          autoCapitalize="none"
        />

        {message ? (
          <InlineMessage tone={message.includes('saved') ? 'success' : 'error'}>
            {message}
          </InlineMessage>
        ) : null}

        <ActionButton
          label="Save settings"
          icon="save"
          onPress={() => void handleSave()}
          busy={saving}
        />

        <Pressable
          accessibilityRole="link"
          onPress={() =>
            void Linking.openURL('https://developers.deriv.com/docs/intro/oauth/')
          }
          style={styles.docsLink}
        >
          <Feather name="external-link" size={15} color={colors.primary} />
          <Text style={[styles.docsText, { color: colors.primary }]}>
            Deriv OAuth setup guide
          </Text>
        </Pressable>
      </Panel>

      <Panel style={styles.permissionsPanel}>
        <Text style={[styles.panelTitle, { color: colors.foreground }]}>
          Permissions and live data
        </Text>
        <Text style={[styles.panelCopy, { color: colors.mutedForeground }]}>
          Partner reports require application_read. The live balance and transaction stream uses the Deriv WebSocket with the App ID above. This app is read-only and does not submit trades.
        </Text>
        <View style={styles.liveStatus}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  status === 'connected'
                    ? colors.primary
                    : status === 'error'
                      ? colors.destructive
                      : colors.mutedForeground,
              },
            ]}
          />
          <Text style={[styles.liveStatusText, { color: colors.mutedForeground }]}>
            WebSocket: {status}
          </Text>
        </View>
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
  autoCapitalize = 'none',
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useColors>;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: colors.input,
            color: colors.foreground,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16, flexGrow: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  connectionPanel: { gap: 15 },
  connectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  connectionText: { flex: 1, gap: 4 },
  panelTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  panelCopy: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  settingsPanel: { gap: 15 },
  sectionHeading: { gap: 5, marginBottom: 2 },
  field: { gap: 7 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  docsLink: {
    minHeight: 38,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  docsText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  permissionsPanel: { gap: 10 },
  liveStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  liveStatusText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
});
