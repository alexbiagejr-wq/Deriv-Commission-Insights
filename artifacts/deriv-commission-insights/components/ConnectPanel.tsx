import React, { useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { friendlyApiError } from '@/lib/deriv';
import { ActionButton, InlineMessage, Panel } from '@/components/ui';

export function ConnectPanel() {
  const colors = useColors();
  const { connectWithToken, settings } = useAuth();
  const [token, setToken] = useState('');
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTokenConnect = async () => {
    Keyboard.dismiss();
    setError(null);
    setBusy(true);
    try {
      await connectWithToken(token);
      setToken('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (reason) {
      setError(friendlyApiError(reason));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
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
            Connect with an API token
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Partner reporting needs the application_read permission.
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background,
            borderColor: colors.input,
          },
        ]}
      >
        <TextInput
          accessibilityLabel="Deriv API token"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Deriv API token"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={!isTokenVisible}
          value={token}
          onChangeText={setToken}
          onSubmitEditing={() => void handleTokenConnect()}
          returnKeyType="go"
          style={[styles.input, { color: colors.foreground }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isTokenVisible ? 'Hide API token' : 'Show API token'
          }
          onPress={() => setIsTokenVisible((visible) => !visible)}
          hitSlop={8}
          style={styles.visibilityToggle}
        >
          <Feather
            name={isTokenVisible ? 'eye-off' : 'eye'}
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>
      </View>

      {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

      <ActionButton
        label="Log in with API token"
        icon="key"
        onPress={() => void handleTokenConnect()}
        busy={busy}
        disabled={!token.trim() || busy}
      />
      <Text style={[styles.privacy, { color: colors.mutedForeground }]}>
        {Platform.OS === 'web'
          ? 'Web preview keeps the token in memory only. The installed mobile app uses secure device storage.'
          : 'Your token stays in this device’s secure storage and is sent directly to Deriv.'}
      </Text>
      {!settings.appId.trim() ? (
        <InlineMessage tone="error">
          Add your Deriv App ID in Settings to connect.
        </InlineMessage>
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
  inputContainer: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  visibilityToggle: {
    minWidth: 44,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacy: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
});
