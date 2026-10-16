import React from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import {
  ActionButton,
  InlineMessage,
  Panel,
  SectionTitle,
  StatusPill,
} from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useLiveAccount } from '@/lib/live-account';
import { formatCurrency } from '@/lib/deriv';

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  if (!Number.isFinite(date.getTime())) return 'Recent';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function LiveAccountSummary() {
  const colors = useColors();
  const { status, error, balance, transactions, reconnect } = useLiveAccount();
  const connected = status === 'connected';
  const statusLabel =
    status === 'connected'
      ? 'Connected'
      : status === 'connecting'
        ? 'Connecting'
        : status === 'error'
          ? 'Issue'
          : 'Offline';
  const statusTone =
    status === 'connected'
      ? 'good'
      : status === 'error'
        ? 'error'
        : status === 'connecting'
          ? 'warning'
          : 'neutral';

  return (
    <>
      <SectionTitle
        title="Live account"
        detail="Read-only balance and transaction updates from Deriv."
      />
      <Panel style={styles.panel}>
        <View style={styles.summaryHeader}>
          <View style={styles.balanceBlock}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              ACCOUNT BALANCE
            </Text>
            <Text style={[styles.balance, { color: colors.foreground }]}>
              {balance
                ? formatCurrency(balance.amount, balance.currency)
                : connected
                  ? 'Waiting for update'
                  : '—'}
            </Text>
          </View>
          <StatusPill label={statusLabel} tone={statusTone} />
        </View>

        {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

        {transactions.length > 0 ? (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.transactionHeading}>
              <Text style={[styles.transactionHeadingText, { color: colors.foreground }]}>
                Recent transactions
              </Text>
              <Feather name="activity" size={15} color={colors.mutedForeground} />
            </View>
            {transactions.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.transaction}>
                <View style={styles.transactionCopy}>
                  <Text
                    numberOfLines={1}
                    style={[styles.description, { color: colors.foreground }]}
                  >
                    {item.description}
                  </Text>
                  <Text style={[styles.time, { color: colors.mutedForeground }]}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.amount,
                    {
                      color: item.amount < 0 ? colors.destructive : colors.primary,
                    },
                  ]}
                >
                  {formatCurrency(item.amount, item.currency)}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        {status === 'error' ? (
          <ActionButton
            label="Reconnect"
            icon="refresh-cw"
            variant="secondary"
            onPress={reconnect}
          />
        ) : null}

        <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
          This app does not place trades.
        </Text>
      </Panel>
    </>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 13, padding: 18 },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  balanceBlock: { gap: 5, flex: 1 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1 },
  balance: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.5 },
  divider: { height: 1 },
  transactionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionHeadingText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  transaction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  transactionCopy: { flex: 1, gap: 3 },
  description: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  time: { fontFamily: 'Inter_400Regular', fontSize: 9 },
  amount: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  footnote: { fontFamily: 'Inter_400Regular', fontSize: 10 },
});
