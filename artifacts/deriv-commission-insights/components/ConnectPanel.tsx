import React, { useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { friendlyApiError } from '@/lib/deriv';
import { ActionButton, InlineMessage, Panel } from '@/components/ui';

export function ConnectPanel() {
  const colors = useColors();
  const { connectWithToken, connectWithOAuth, settings } = useAuth();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState<'pat' | 'oauth' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTokenConnect = async () => {
    Keyboard.dismiss();
    setError(null);
    setBusy('pat');
    try {
      await connectWithToken(token);
      setToken('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (reason) {
      setError(friendlyApiError(reason));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(null);
    }
  };

  const handleOAuthConnect = async () => {
    setError(null);
    setBusy('oauth');
    try {
      await connectWithOAuth();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (reason) {
      setError(friendlyApiError(reason));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel style={styles.panel}>
      <View style={styles.intro}>
        <View style={[styles.iconBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.iconText, { color: colors.primary }]}>D</Text>
        </View>
        <View style={styles.introCopy}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Connect your Deriv account
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Partner reporting needs the application_read permission.
          </Text>
        </View>
      </View>

      <TextInput
        accessibilityLabel="Deriv personal access token"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Personal access token"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        value={token}
        onChangeText={setToken}
        onSubmitEditing={() => void handleTokenConnect()}
        returnKeyType="go"
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: colors.input,
            color: colors.foreground,
          },
        ]}
      />

      {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

      <ActionButton
        label="Connect with personal token"
        icon="key"
        onPress={() => void handleTokenConnect()}
        busy={busy === 'pat'}
        disabled={!token.trim() || busy !== null}
      />
      <ActionButton
        label="Log in with Deriv"
        icon="log-in"
        variant="secondary"
        onPress={() => void handleOAuthConnect()}
        busy={busy === 'oauth'}
        disabled={busy !== null}
      />
      <Text style={[styles.privacy, { color: colors.mutedForeground }]}>
        {Platform.OS === 'web'
          ? 'Web preview keeps the token in memory only. The installed mobile app uses secure device storage.'
          : 'Your token stays in this device’s secure storage and is sent directly to Deriv.'}
      </Text>
      <Text style={[styles.privacy, { color: colors.mutedForeground }]}>
        OAuth uses the registered client ID and redirect URL saved in Settings.
      </Text>
      {!settings.appId.trim() ? (
        <InlineMessage tone="error">Add your Deriv App ID in Settings to connect.</InlineMessage>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 20, gap: 13 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  introCopy: { flex: 1, gap: 4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  privacy: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
});
