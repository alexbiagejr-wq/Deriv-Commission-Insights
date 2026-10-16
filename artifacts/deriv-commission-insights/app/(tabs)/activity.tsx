import React from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import {
  ActionButton,
  InlineMessage,
  PageHeader,
  Panel,
  Screen,
  SectionTitle,
  StatusPill,
} from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { useLiveAccount } from '@/lib/live-account';
import { formatCurrency } from '@/lib/deriv';

function formatTransactionTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  if (!Number.isFinite(date.getTime())) return 'Recent';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function ActivityScreen() {
  const colors = useColors();
  const { session } = useAuth();
  const { status, error, balance, transactions, reconnect } = useLiveAccount();
  const connected = status === 'connected';

  return (
    <Screen>
      <PageHeader
        eyebrow="REAL-TIME ACCOUNT"
        title="Live connection"
        subtitle="Read-only balance and transaction updates from Deriv."
        trailing={
          <StatusPill
            label={
              status === 'connected'
                ? 'Connected'
                : status === 'connecting'
                  ? 'Connecting'
                  : status === 'error'
                    ? 'Issue'
                    : 'Offline'
            }
            tone={
              status === 'connected'
                ? 'good'
                : status === 'error'
                  ? 'error'
                  : status === 'connecting'
                    ? 'warning'
                    : 'neutral'
            }
          />
        }
      />

      {!session ? (
        <InlineMessage>
          Connect your Deriv account from Overview or Settings to start the authenticated WebSocket.
        </InlineMessage>
      ) : null}

      <Panel style={styles.balancePanel}>
        <View style={styles.balanceHeading}>
          <View style={styles.balanceCopy}>
            <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>
              ACCOUNT BALANCE
            </Text>
            <Text style={[styles.balanceValue, { color: colors.foreground }]}>
              {balance
                ? formatCurrency(balance.amount, balance.currency)
                : connected
                  ? 'Waiting for update'
                  : '—'}
            </Text>
          </View>
          <View
            style={[
              styles.balanceIcon,
              { backgroundColor: connected ? colors.secondary : colors.muted },
            ]}
          >
            <Feather
              name="activity"
              size={20}
              color={connected ? colors.primary : colors.mutedForeground}
            />
          </View>
        </View>
        <Text style={[styles.balanceHint, { color: colors.mutedForeground }]}>
          Live data comes from your account session. This app does not place trades.
        </Text>
      </Panel>

      {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

      <View style={styles.actions}>
        {session ? (
          <ActionButton
            label={status === 'connecting' ? 'Connecting to Deriv…' : 'Reconnect'}
            icon="refresh-cw"
            onPress={reconnect}
            disabled={status === 'connecting'}
          />
        ) : null}
      </View>

      <SectionTitle
        title="Recent transactions"
        detail="Events received while this app is connected."
      />

      {transactions.length === 0 ? (
        <Panel style={styles.emptyPanel}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Feather name="inbox" size={18} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No live events yet
          </Text>
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
            When Deriv sends account transactions, they’ll appear here.
          </Text>
        </Panel>
      ) : (
        <Panel style={styles.transactionPanel}>
          {transactions.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.border },
                  ]}
                />
              ) : null}
              <View style={styles.transactionRow}>
                <View style={styles.transactionCopy}>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.transactionTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    {item.description}
                  </Text>
                  <Text
                    style={[
                      styles.transactionTime,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {formatTransactionTime(item.timestamp)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color: item.amount < 0 ? colors.destructive : colors.primary,
                    },
                  ]}
                >
                  {formatCurrency(item.amount, item.currency)}
                </Text>
              </View>
            </View>
          ))}
        </Panel>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balancePanel: { padding: 20, gap: 15 },
  balanceHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  balanceCopy: { gap: 6, flex: 1 },
  balanceLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  balanceValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 27,
    letterSpacing: -0.6,
  },
  balanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceHint: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  actions: { minHeight: 0 },
  emptyPanel: { alignItems: 'flex-start', gap: 10, padding: 18 },
  emptyIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  emptyHint: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  transactionPanel: { paddingVertical: 2 },
  divider: { height: 1, marginHorizontal: 2 },
  transactionRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 12,
  },
  transactionCopy: { flex: 1, gap: 6 },
  transactionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  transactionTime: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  transactionAmount: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});
