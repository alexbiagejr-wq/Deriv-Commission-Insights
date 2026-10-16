import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import {
  InlineMessage,
  LoadingBlock,
  PageHeader,
  Panel,
  PeriodPicker,
  Screen,
  SectionTitle,
  StatusPill,
} from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import {
  fetchMarkupStatistics,
  formatUsd,
  friendlyApiError,
  getCurrentMonthDateRange,
  DateRange,
} from "@/lib/deriv";

export default function AppsScreen() {
  const colors = useColors();
  const { session } = useAuth();
  const [range, setRange] = useState<DateRange>(getCurrentMonthDateRange);
  const query = useQuery({
    queryKey: ["app-markup", session?.id, range.start, range.end],
    queryFn: () => fetchMarkupStatistics(session!, range),
    enabled: Boolean(session),
    retry: false,
    staleTime: 60_000,
  });
  const apps = query.data?.breakdown ?? [];
  const totalCommission = apps.reduce(
    (total, app) => total + Math.max(0, app.app_markup_usd),
    0,
  );
  const commissionSlices = apps
    .map((app, index) => ({
      app,
      index,
      amount: Math.max(0, app.app_markup_usd),
    }))
    .filter((slice) => slice.amount > 0);

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
            label={session ? "Live report" : "Connect"}
            tone={session ? "good" : "warning"}
          />
        }
      />

      <PeriodPicker value={range} onChange={setRange} />

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
            onPress={() => router.push("/(tabs)/settings")}
            style={[styles.linkButton, { backgroundColor: colors.secondary }]}
          >
            <Text
              style={[styles.linkText, { color: colors.secondaryForeground }]}
            >
              Open settings
            </Text>
            <Feather
              name="arrow-right"
              size={15}
              color={colors.secondaryForeground}
            />
          </Pressable>
        </Panel>
      ) : query.isLoading ? (
        <LoadingBlock label="Loading per-app report…" />
      ) : query.error ? (
        <InlineMessage tone="error">
          {friendlyApiError(query.error)}
        </InlineMessage>
      ) : query.data ? (
        <>
          <Panel style={styles.summary}>
            <Text
              style={[styles.summaryLabel, { color: colors.mutedForeground }]}
            >
              TOTAL APP MARKUP
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {formatUsd(query.data.total_app_markup_usd)}
            </Text>
            <Text
              style={[styles.summaryNote, { color: colors.mutedForeground }]}
            >
              {query.data.total_client_count} clients ·{" "}
              {query.data.total_contract_count} contracts ·{" "}
              {formatUsd(query.data.total_volume_usd)} volume
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
              <Feather
                name="bar-chart-2"
                size={22}
                color={colors.mutedForeground}
              />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No app activity in this period
              </Text>
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                Registered Deriv apps will appear here when they have reportable
                activity.
              </Text>
            </Panel>
          ) : (
            <>
              <Panel style={styles.piePanel}>
                <Text style={[styles.pieTitle, { color: colors.foreground }]}>
                  Registered apps
                </Text>
                <Text
                  style={[
                    styles.pieSubtitle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Share of total commission by app ID
                </Text>
                <View style={styles.pieChartWrap}>
                  <Svg width={180} height={180} viewBox="0 0 180 180">
                    {commissionSlices.length === 0 ? (
                      <Circle cx={90} cy={90} r={82} fill={colors.muted} />
                    ) : commissionSlices.length === 1 ? (
                      <Circle
                        cx={90}
                        cy={90}
                        r={82}
                        fill={appColor(commissionSlices[0].index)}
                      />
                    ) : (
                      commissionSlices.map((slice, index) => {
                        const startFraction =
                          commissionSlices
                            .slice(0, index)
                            .reduce((sum, item) => sum + item.amount, 0) /
                          totalCommission;
                        const endFraction =
                          startFraction + slice.amount / totalCommission;
                        return (
                          <Path
                            key={slice.app.app_id}
                            d={getPieSlicePath(
                              90,
                              90,
                              82,
                              startFraction,
                              endFraction,
                            )}
                            fill={appColor(slice.index)}
                            stroke={colors.card}
                            strokeWidth={2}
                          />
                        );
                      })
                    )}
                    <Circle cx={90} cy={90} r={48} fill={colors.card} />
                  </Svg>
                  <View style={styles.pieCenter}>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[styles.pieTotal, { color: colors.foreground }]}
                    >
                      {formatUsd(totalCommission)}
                    </Text>
                    <Text
                      style={[
                        styles.pieCenterLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      COMMISSION
                    </Text>
                  </View>
                </View>
                {commissionSlices.length === 0 ? (
                  <Text
                    style={[
                      styles.pieNoCommission,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    No commission generated in this period.
                  </Text>
                ) : null}
                <View style={styles.pieLegend}>
                  {query.data.breakdown.map((app, index) => (
                    <View key={app.app_id} style={styles.pieLegendItem}>
                      <View
                        style={[
                          styles.pieLegendDot,
                          {
                            backgroundColor:
                              app.app_markup_usd > 0
                                ? appColor(index)
                                : colors.mutedForeground,
                          },
                        ]}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.pieLegendText,
                          { color: colors.foreground },
                        ]}
                      >
                        {app.app_name?.trim() || "Deriv app"} · {app.app_id}
                      </Text>
                      <Text
                        style={[
                          styles.pieLegendCount,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {formatUsd(app.app_markup_usd)} ·{" "}
                        {totalCommission > 0
                          ? `${((Math.max(0, app.app_markup_usd) / totalCommission) * 100).toFixed(1)}%`
                          : "0%"}
                      </Text>
                    </View>
                  ))}
                </View>
              </Panel>

              {query.data.breakdown.map((app) => (
                <Panel key={app.app_id} style={styles.appPanel}>
                  <View style={styles.appHeader}>
                    <View style={styles.appIdentity}>
                      <View
                        style={[
                          styles.appIcon,
                          { backgroundColor: colors.secondary },
                        ]}
                      >
                        <Feather
                          name="globe"
                          size={17}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.appNameBlock}>
                        <Text
                          style={[
                            styles.appTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          {app.app_name?.trim() || "Deriv app"}
                        </Text>
                        <Text
                          style={[
                            styles.appSubtitle,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          App ID {app.app_id} · {app.client_count} clients ·{" "}
                          {app.contract_count} contracts
                        </Text>
                      </View>
                    </View>
                    <View style={styles.appMarkup}>
                      <Text
                        style={[
                          styles.appMarkupLabel,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        MARKUP
                      </Text>
                      <Text
                        style={[
                          styles.appMarkupValue,
                          { color: colors.primary },
                        ]}
                      >
                        {formatUsd(app.app_markup_usd)}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[styles.rule, { backgroundColor: colors.border }]}
                  />
                  <View style={styles.appMetrics}>
                    <View style={styles.appMetric}>
                      <Text
                        style={[
                          styles.appMetricLabel,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Trading volume
                      </Text>
                      <Text
                        style={[
                          styles.appMetricValue,
                          { color: colors.foreground },
                        ]}
                      >
                        {formatUsd(app.volume_usd)}
                      </Text>
                    </View>
                    <View style={styles.appMetric}>
                      <Text
                        style={[
                          styles.appMetricLabel,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Payout
                      </Text>
                      <Text
                        style={[
                          styles.appMetricValue,
                          { color: colors.foreground },
                        ]}
                      >
                        {formatUsd(app.payout_usd)}
                      </Text>
                    </View>
                  </View>
                </Panel>
              ))}
            </>
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

function appColor(index: number): string {
  const hue = (index * 137.508) % 360;
  const saturation = 68;
  const lightness = 48;
  const chroma = ((100 - Math.abs(2 * lightness - 100)) * saturation) / 10000;
  const hueSection = hue / 60;
  const x = chroma * (1 - Math.abs((hueSection % 2) - 1));
  const [red, green, blue] =
    hueSection < 1
      ? [chroma, x, 0]
      : hueSection < 2
        ? [x, chroma, 0]
        : hueSection < 3
          ? [0, chroma, x]
          : hueSection < 4
            ? [0, x, chroma]
            : hueSection < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const match = lightness / 100 - chroma / 2;
  return `#${[red, green, blue]
    .map((channel) =>
      Math.round((channel + match) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function getPieSlicePath(
  centerX: number,
  centerY: number,
  radius: number,
  startFraction: number,
  endFraction: number,
): string {
  const startAngle = startFraction * Math.PI * 2 - Math.PI / 2;
  const endAngle = endFraction * Math.PI * 2 - Math.PI / 2;
  const startX = centerX + radius * Math.cos(startAngle);
  const startY = centerY + radius * Math.sin(startAngle);
  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY + radius * Math.sin(endAngle);
  const largeArc = endFraction - startFraction > 0.5 ? 1 : 0;

  return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

const styles = StyleSheet.create({
  summary: { padding: 20, gap: 7 },
  summaryLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.25,
  },
  summaryValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    letterSpacing: -0.8,
  },
  summaryNote: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 17 },
  sectionIntro: { marginTop: 2 },
  piePanel: { padding: 18, gap: 6, alignItems: "center" },
  pieTitle: { alignSelf: "stretch", fontFamily: "Inter_700Bold", fontSize: 15 },
  pieSubtitle: {
    alignSelf: "stretch",
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  pieChartWrap: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  pieCenter: { position: "absolute", alignItems: "center", gap: 2 },
  pieTotal: { maxWidth: 82, fontFamily: "Inter_700Bold", fontSize: 15 },
  pieCenterLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 8,
    letterSpacing: 0.6,
  },
  pieNoCommission: { fontFamily: "Inter_400Regular", fontSize: 11 },
  pieLegend: { alignSelf: "stretch", gap: 10, marginTop: 4 },
  pieLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  pieLegendDot: { width: 10, height: 10, borderRadius: 5 },
  pieLegendText: {
    flex: 1,
    minWidth: 0,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  pieLegendCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    textAlign: "right",
  },
  appPanel: { padding: 16, gap: 13 },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  appIdentity: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  appIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  appNameBlock: { gap: 4, flex: 1 },
  appTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  appSubtitle: { fontFamily: "Inter_400Regular", fontSize: 10 },
  appMarkup: { alignItems: "flex-end", gap: 3 },
  appMarkupLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 1,
  },
  appMarkupValue: { fontFamily: "Inter_700Bold", fontSize: 17 },
  rule: { height: 1 },
  appMetrics: { flexDirection: "row", gap: 12 },
  appMetric: { flex: 1, gap: 4 },
  appMetricLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },
  appMetricValue: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  emptyPanel: { alignItems: "flex-start", gap: 12, padding: 20 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  linkButton: {
    alignSelf: "stretch",
    minHeight: 44,
    borderRadius: 13,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});
