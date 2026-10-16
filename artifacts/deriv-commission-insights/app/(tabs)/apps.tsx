import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  InlineMessage,
  LoadingBlock,
  PageHeader,
  Panel,
  PeriodPicker,
  Screen,
  SectionTitle,
  StatusPill,
} from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import {
  fetchMarkupStatistics,
  formatUsd,
  friendlyApiError,
  getDateRange,
  ReportPeriod,
} from '@/lib/deriv';

export default function AppsScreen() {
  const colors = useColors();
  const { session } = useAuth();
  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const range = getDateRange(period);
  const query = useQuery({
    queryKey: ['app-markup', session?.id, range.start, range.end],
    queryFn: () => fetchMarkupStatistics(session!, range),
    enabled: Boolean(session),
    retry: false,
    staleTime: 60_000,
  });

  return (
    <Screen
      refreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
    >
      <PageHeader
        eyebrow="APP PERFORMANCE"
        title="Registered apps"
        subtitle="Markup and trading activity reported by Deriv."
        trailing={
          <StatusPill
            label={session ? 'Live report' : 'Connect'}
            tone={session ? 'good' : 'warning'}
          />
        }
      />

      <PeriodPicker value={period} onChange={setPeriod} />

      {!session ? (
        <Panel style={styles.emptyPanel}>
          <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
            <Feather name="globe" size={21} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Connect to see app earnings
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Sign in from Overview or Settings to load the per-app markup report.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/settings')}
            style={[styles.linkButton, { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.linkText, { color: colors.secondaryForeground }]}>
              Open settings
            </Text>
            <Feather name="arrow-right" size={15} color={colors.secondaryForeground} />
          </Pressable>
        </Panel>
      ) : query.isLoading ? (
        <LoadingBlock label="Loading per-app report…" />
      ) : query.error ? (
        <InlineMessage tone="error">{friendlyApiError(query.error)}</InlineMessage>
      ) : query.data ? (
        <>
          <Panel style={styles.summary}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              TOTAL APP MARKUP
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {formatUsd(query.data.total_app_markup_usd)}
            </Text>
            <Text style={[styles.summaryNote, { color: colors.mutedForeground }]}>
              {query.data.total_client_count} clients · {query.data.total_contract_count} contracts · {formatUsd(query.data.total_volume_usd)} volume
            </Text>
          </Panel>

          <View style={styles.sectionIntro}>
            <SectionTitle
              title="App breakdown"
              detail={`${range.start} — ${range.end} · all figures in USD`}
            />
          </View>

          {query.data.breakdown.length === 0 ? (
            <Panel style={styles.emptyPanel}>
              <Feather name="bar-chart-2" size={22} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No app activity in this period
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Registered Deriv apps will appear here when they have reportable activity.
              </Text>
            </Panel>
          ) : (
            query.data.breakdown.map((app) => (
              <Panel key={app.app_id} style={styles.appPanel}>
                <View style={styles.appHeader}>
                  <View style={styles.appIdentity}>
                    <View
                      style={[
                        styles.appIcon,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <Feather name="globe" size={17} color={colors.primary} />
                    </View>
                    <View style={styles.appNameBlock}>
                      <Text style={[styles.appTitle, { color: colors.foreground }]}>
                        Deriv app {app.app_id}
                      </Text>
                      <Text style={[styles.appSubtitle, { color: colors.mutedForeground }]}>
                        {app.client_count} clients · {app.contract_count} contracts
                      </Text>
                    </View>
                  </View>
                  <View style={styles.appMarkup}>
                    <Text style={[styles.appMarkupLabel, { color: colors.mutedForeground }]}>
                      MARKUP
                    </Text>
                    <Text style={[styles.appMarkupValue, { color: colors.primary }]}>
                      {formatUsd(app.app_markup_usd)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.rule, { backgroundColor: colors.border }]} />
                <View style={styles.appMetrics}>
                  <View style={styles.appMetric}>
                    <Text style={[styles.appMetricLabel, { color: colors.mutedForeground }]}>
                      Trading volume
                    </Text>
                    <Text style={[styles.appMetricValue, { color: colors.foreground }]}>
                      {formatUsd(app.volume_usd)}
                    </Text>
                  </View>
                  <View style={styles.appMetric}>
                    <Text style={[styles.appMetricLabel, { color: colors.mutedForeground }]}>
                      Payout
                    </Text>
                    <Text style={[styles.appMetricValue, { color: colors.foreground }]}>
                      {formatUsd(app.payout_usd)}
                    </Text>
                  </View>
                </View>
              </Panel>
            ))
          )}

          <InlineMessage>
            Deriv identifies these rows by registered application ID. This feed
            does not include unrelated affiliate networks or website platforms.
          </InlineMessage>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { padding: 20, gap: 7 },
  summaryLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1.25,
  },
  summaryValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    letterSpacing: -0.8,
  },
  summaryNote: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  sectionIntro: { marginTop: 2 },
  appPanel: { padding: 16, gap: 13 },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  appIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  appIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appNameBlock: { gap: 4, flex: 1 },
  appTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  appSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  appMarkup: { alignItems: 'flex-end', gap: 3 },
  appMarkupLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  appMarkupValue: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  rule: { height: 1 },
  appMetrics: { flexDirection: 'row', gap: 12 },
  appMetric: { flex: 1, gap: 4 },
  appMetricLabel: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  appMetricValue: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  emptyPanel: { alignItems: 'flex-start', gap: 12, padding: 20 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  linkButton: {
    alignSelf: 'stretch',
    minHeight: 44,
    borderRadius: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});
