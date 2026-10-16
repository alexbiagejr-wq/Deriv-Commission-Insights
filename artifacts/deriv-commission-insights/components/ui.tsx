import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function Screen({
  children,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset =
    Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top + 8;
  const bottomInset =
    Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.screenContent,
        { paddingTop: topInset, paddingBottom: bottomInset + 104 },
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderCopy}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ActionButton({
  label,
  icon,
  onPress,
  busy,
  disabled,
  variant = 'primary',
}: {
  label: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const colors = useColors();
  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.destructive
        : colors.secondary;
  const foreground =
    variant === 'primary'
      ? colors.primaryForeground
      : variant === 'danger'
        ? colors.destructiveForeground
        : colors.secondaryForeground;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: background, opacity: pressed ? 0.85 : 1 },
        (disabled || busy) && styles.disabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : icon ? (
        <Feather name={icon} size={17} color={foreground} />
      ) : null}
      <Text style={[styles.actionText, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function StatusPill({
  label,
  tone = 'neutral',
  dot = true,
}: {
  label: string;
  tone?: 'good' | 'warning' | 'error' | 'neutral';
  dot?: boolean;
}) {
  const colors = useColors();
  const color =
    tone === 'good'
      ? colors.primary
      : tone === 'warning'
        ? colors.accentForeground
        : tone === 'error'
          ? colors.destructive
          : colors.mutedForeground;
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: tone === 'good' ? colors.secondary : colors.muted,
        },
      ]}
    >
      {dot ? <View style={[styles.pillDot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function InlineMessage({
  children,
  tone = 'info',
}: {
  children: React.ReactNode;
  tone?: 'info' | 'error' | 'success';
}) {
  const colors = useColors();
  const color =
    tone === 'error'
      ? colors.destructive
      : tone === 'success'
        ? colors.primary
        : colors.mutedForeground;
  const background =
    tone === 'error'
      ? `${colors.destructive}14`
      : tone === 'success'
        ? `${colors.primary}12`
        : colors.muted;
  return (
    <View style={[styles.message, { backgroundColor: background }]}>
      <Feather
        name={tone === 'error' ? 'alert-circle' : tone === 'success' ? 'check-circle' : 'info'}
        size={16}
        color={color}
      />
      <Text style={[styles.messageText, { color }]}>{children}</Text>
    </View>
  );
}

export function PeriodPicker({
  value,
  onChange,
}: {
  value: '7d' | '30d' | '90d';
  onChange: (value: '7d' | '30d' | '90d') => void;
}) {
  const colors = useColors();
  const options: Array<{ value: '7d' | '30d' | '90d'; label: string }> = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
  ];
  return (
    <View style={[styles.periodTrack, { backgroundColor: colors.muted }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.periodOption,
              selected && { backgroundColor: colors.card },
            ]}
          >
            <Text
              style={[
                styles.periodText,
                {
                  color: selected ? colors.foreground : colors.mutedForeground,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionTitle({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
        {title}
      </Text>
      {detail ? (
        <Text style={[styles.sectionDetail, { color: colors.mutedForeground }]}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

export function LoadingBlock({ label = 'Loading Deriv data…' }: { label?: string }) {
  const colors = useColors();
  return (
    <Panel style={styles.loadingBlock}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: 20, gap: 18, flexGrow: 1 },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  pageHeaderCopy: { flex: 1, gap: 5 },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  panel: {
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  actionButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  disabled: { opacity: 0.55 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 13,
    padding: 12,
  },
  messageText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
  },
  periodTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 4,
  },
  periodOption: {
    flex: 1,
    minHeight: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  sectionTitle: { gap: 4 },
  sectionHeading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  sectionDetail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  helperText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  loadingBlock: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
