import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { CommissionGrowthChart } from '@/components/CommissionGrowthChart';
import { ConnectPanel } from '@/components/ConnectPanel';
import {
  ActionButton,
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
  fetchPartnerOverview,
  formatUsd,
  friendlyApiError,
  getCurrentMonthDateRange,
  getTodayDateRange,
  DateRange,
} from '@/lib/deriv';

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>
        {value}
      </Text>
      {note ? (
        <Text style={[styles.metricNote, { color: colors.mutedForeground }]}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

export default function OverviewScreen() {
  const colors = useColors();
  const { session, isReady } = useAuth();
  const [range, setRange] = useState<DateRange>(getCurrentMonthDateRange);
  const todayRange = getTodayDateRange();
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${todayRange.start}T00:00:00.000Z`));
  const overviewQuery = useQuery({
    queryKey: ['partner-overview', session?.id, range.start, range.end],
    queryFn: () => fetchPartnerOverview(session!, range),
    enabled: Boolean(session),
    retry: false,
    staleTime: 60_000,
  });
  const todayCommissionQuery = useQuery({
    queryKey: ['today-app-commission', session?.id, todayRange.start],
    queryFn: () => fetchMarkupStatistics(session!, todayRange),
    enabled: Boolean(session),
    retry: false,
    staleTime: 60_000,
  });
  const markupQuery = useQuery({
    queryKey: ['app-markup', session?.id, range.start, range.end],
    queryFn: () => fetchMarkupStatistics(session!, range),
    enabled: Boolean(session),
    retry: false,
    staleTime: 60_000,
  });

  const refresh = async () => {
    await Promise.all([
      overviewQuery.refetch(),
      todayCommissionQuery.refetch(),
      markupQuery.refetch(),
    ]);
  };

  if (!isReady) {
    return (
      <Screen>
        <LoadingBlock label="Preparing your secure Deriv connection…" />
      </Screen>
    );
  }

  const overviewError = overviewQuery.error
    ? friendlyApiError(overviewQuery.error)
    : null;
  const markupError = markupQuery.error
    ? friendlyApiError(markupQuery.error)
    : null;
  const todayCommissionError = todayCommissionQuery.error
    ? friendlyApiError(todayCommissionQuery.error)
    : null;

  return (
    <Screen
      refreshing={
        overviewQuery.isFetching ||
        todayCommissionQuery.isFetching ||
        markupQuery.isFetching
      }
      onRefresh={() => void refresh()}
    >
      <View style={styles.overviewHeader}>
        <View
          accessibilityLabel="Powered by DBOTPULSE.SITE"
          style={[
            styles.poweredBy,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Feather name="zap" size={12} color={colors.primary} />
          <Text
            style={[styles.poweredByLabel, { color: colors.mutedForeground }]}
          >
            POWERED BY
          </Text>
          <View
            style={[styles.brandDivider, { backgroundColor: colors.border }]}
          />
          <Text style={[styles.brandName, { color: colors.primary }]}>
            DBOTPULSE.SITE
          </Text>
        </View>
        <PageHeader
          eyebrow="DERIV PARTNER INSIGHTS"
          title="Commission overview"
          subtitle="Partner earnings and app performance, together."
          trailing={
            <StatusPill
              label={session ? 'Connected' : 'Not connected'}
              tone={session ? 'good' : 'warning'}
            />
          }
        />
      </View>

      {!session ? (
        <>
          <ConnectPanel />
          <InlineMessage>
            Deriv’s partner reports cover partner commissions and markup for
            registered apps. They do not include unrelated affiliate networks.
          </InlineMessage>
        </>
      ) : (
        <>
          <PeriodPicker value={range} onChange={setRange} />

          {overviewError ? (
            <InlineMessage tone="error">{overviewError}</InlineMessage>
          ) : null}
          {markupError ? (
            <InlineMessage tone="error">{markupError}</InlineMessage>
          ) : null}
          {todayCommissionError ? (
            <InlineMessage tone="error">{todayCommissionError}</InlineMessage>
          ) : null}

          {overviewQuery.isLoading || todayCommissionQuery.isLoading ? (
            <LoadingBlock label="Loading partner activity…" />
          ) : overviewQuery.data && todayCommissionQuery.data ? (
            <Panel style={styles.activitySummary}>
              <View style={styles.twoMetrics}>
                <Metric
                  label="Today’s commission"
                  value={formatUsd(todayCommissionQuery.data.total_app_markup_usd)}
                  note={`${todayLabel} · registered app markup`}
                />
                <Metric
                  label="Active traders"
                  value={String(overviewQuery.data.activity.active_traders)}
                  note="Referred clients"
                />
              </View>
            </Panel>
          ) : null}

          {session ? <CommissionGrowthChart session={session} /> : null}

          {markupQuery.isLoading ? (
            <LoadingBlock label="Loading registered-app markup…" />
          ) : markupQuery.data ? (
            <Panel style={styles.markupPanel}>
              <View style={styles.markupHeading}>
                <View style={styles.panelTitleCopy}>
                  <Text style={[styles.panelEyebrow, { color: colors.accentForeground }]}>
                    REGISTERED APPS
                  </Text>
                  <Text style={[styles.markupValue, { color: colors.foreground }]}>
                    {formatUsd(markupQuery.data.total_app_markup_usd)}
                  </Text>
                  <Text
                    style={[
                      styles.heroCaption,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Total app markup
                  </Text>
                </View>
                <View
                  style={[
                    styles.heroIcon,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Text style={[styles.heroIconText, { color: colors.accentForeground }]}>
                    ↗
                  </Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.twoMetrics}>
                <Metric
                  label="Trading volume"
                  value={formatUsd(markupQuery.data.total_volume_usd)}
                />
                <Metric
                  label="Contracts"
                  value={String(markupQuery.data.total_contract_count)}
                />
              </View>
            </Panel>
          ) : null}

          {overviewQuery.data ? (
            <>
              <SectionTitle
                title="Partner activity"
                detail={`${range.start} — ${range.end} · USD`}
              />
              <Panel style={styles.activityPanel}>
                <Metric
                  label="New sign-ups"
                  value={String(overviewQuery.data.signups.total)}
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.twoMetrics}>
                  <Metric
                    label="Real accounts"
                    value={String(overviewQuery.data.signups.real_accounts)}
                  />
                  <Metric
                    label="First deposits"
                    value={String(overviewQuery.data.signups.first_time_depositors)}
                  />
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.twoMetrics}>
                  <Metric
                    label="First-time traders"
                    value={String(overviewQuery.data.signups.first_time_traders)}
                  />
                  <Metric
                    label="Active sub-partners"
                    value={String(overviewQuery.data.master_partner.active_subpartners)}
                  />
                </View>
              </Panel>
            </>
          ) : null}

          <ActionButton
            label="Refresh reports"
            icon="refresh-cw"
            variant="secondary"
            onPress={() => void refresh()}
            busy={overviewQuery.isFetching || markupQuery.isFetching}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  overviewHeader: { gap: 9 },
  poweredBy: {
    alignSelf: 'flex-start',
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  poweredByLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
    letterSpacing: 1,
  },
  brandDivider: { width: 1, height: 12 },
  brandName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  activitySummary: { padding: 20, gap: 12 },
  panelHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  panelTitleCopy: { gap: 4, flex: 1 },
  panelEyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1.25,
  },
  heroValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 37,
    letterSpacing: -1.2,
    marginTop: 3,
  },
  heroCaption: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: { fontFamily: 'Inter_700Bold', fontSize: 23 },
  divider: { height: 1, width: '100%' },
  twoMetrics: { flexDirection: 'row', gap: 14 },
  metric: { flex: 1, gap: 5 },
  metricLabel: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  metricValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 19,
    letterSpacing: -0.3,
  },
  metricNote: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  markupPanel: { padding: 20, gap: 16 },
  markupHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  markupValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    letterSpacing: -0.8,
    marginTop: 3,
  },
  activityPanel: { gap: 16 },
});
