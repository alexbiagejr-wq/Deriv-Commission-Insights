import React, { useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import { InlineMessage, LoadingBlock, Panel } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import {
  DateRange,
  DerivSession,
  fetchMarkupStatistics,
  formatUsd,
  friendlyApiError,
  getMonthDateRange,
} from "@/lib/deriv";

type CandleInterval = "monthly" | "daily";

interface CommissionCandle {
  label: string;
  period: string;
  open: number;
  high: number;
  low: number;
  close: number;
  growthPercent: number | null;
}

interface CommissionPoint {
  date: string;
  amount: number;
}

async function fetchCommissionPoints(
  session: DerivSession,
  ranges: DateRange[],
): Promise<CommissionPoint[]> {
  const points: CommissionPoint[] = [];
  const concurrency = 4;

  for (let index = 0; index < ranges.length; index += concurrency) {
    const batch = ranges.slice(index, index + concurrency);
    const results = await Promise.all(
      batch.map(async (range) => {
        const report = await fetchMarkupStatistics(session, range);
        return {
          date: range.start,
          amount: report.total_app_markup_usd,
        };
      }),
    );
    points.push(...results);
  }

  return points;
}

function getMonthlyRanges(): DateRange[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const month = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1),
    );
    return getMonthDateRange(month.getUTCMonth(), month.getUTCFullYear());
  });
}

function getDailyRanges(): DateRange[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  const ranges: DateRange[] = [];

  for (
    const date = new Date(monthStart);
    date <= today;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const isoDate = date.toISOString().slice(0, 10);
    ranges.push({ start: isoDate, end: isoDate });
  }

  return ranges;
}

function toCandles(
  points: CommissionPoint[],
  interval: CandleInterval,
): CommissionCandle[] {
  return points.map((point, index) => {
    const close = point.amount;
    const previous = points[index - 1];
    const periodDate = new Date(`${point.date}T00:00:00.000Z`);
    const label =
      interval === "monthly"
        ? new Intl.DateTimeFormat(undefined, {
            month: "short",
            timeZone: "UTC",
          }).format(periodDate)
        : String(periodDate.getUTCDate());

    return {
      label,
      period:
        interval === "monthly"
          ? new Intl.DateTimeFormat(undefined, {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(periodDate)
          : new Intl.DateTimeFormat(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            }).format(periodDate),
      open: 0,
      high: Math.max(0, close),
      low: 0,
      close,
      growthPercent:
        !previous || previous.amount === 0
          ? null
          : ((close - previous.amount) / Math.abs(previous.amount)) * 100,
    };
  });
}

export function CommissionGrowthChart({ session }: { session: DerivSession }) {
  const colors = useColors();
  const [interval, setInterval] = useState<CandleInterval>("monthly");
  const today = new Date().toISOString().slice(0, 10);
  const query = useQuery({
    queryKey: ["registered-app-commission-growth", session.id, interval, today],
    queryFn: async () => {
      const ranges =
        interval === "monthly" ? getMonthlyRanges() : getDailyRanges();
      const points = await fetchCommissionPoints(session, ranges);
      return toCandles(points, interval);
    },
    retry: false,
    staleTime: 5 * 60_000,
  });
  const candles = query.data ?? [];
  const latest = candles.at(-1);

  return (
    <Panel style={styles.panel}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Commission growth
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Registered-app commission · each candle starts at $0
          </Text>
        </View>
        <View
          accessibilityLabel="Choose chart interval"
          style={[styles.intervalControl, { backgroundColor: colors.muted }]}
        >
          {(["monthly", "daily"] as const).map((option) => {
            const selected = interval === option;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option}
                onPress={() => setInterval(option)}
                style={[
                  styles.intervalButton,
                  selected && { backgroundColor: colors.card },
                ]}
              >
                <Text
                  style={[
                    styles.intervalText,
                    {
                      color: selected
                        ? colors.foreground
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  {option === "monthly" ? "Monthly" : "Daily"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {query.isLoading ? (
        <LoadingBlock label={`Loading ${interval} commission history…`} />
      ) : query.error ? (
        <InlineMessage tone="error">
          {friendlyApiError(query.error)}
        </InlineMessage>
      ) : candles.length > 0 ? (
        <>
          {latest ? (
            <View style={[styles.latest, { backgroundColor: colors.muted }]}>
              <View style={styles.latestCopy}>
                <Text
                  style={[
                    styles.latestLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  LATEST · {latest.period.toUpperCase()}
                </Text>
                <Text
                  style={[styles.latestValue, { color: colors.foreground }]}
                >
                  {formatUsd(latest.close)}
                </Text>
              </View>
              <View style={styles.growth}>
                <Text style={[styles.growthValue, { color: colors.primary }]}>
                  {latest.growthPercent === null
                    ? "—"
                    : `${latest.growthPercent >= 0 ? "+" : ""}${latest.growthPercent.toFixed(1)}%`}
                </Text>
                <Text
                  style={[
                    styles.growthLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {interval === "monthly"
                    ? "vs previous month"
                    : "daily commission"}
                </Text>
              </View>
            </View>
          ) : null}
          <CandlesChart candles={candles} interval={interval} />
          <View style={styles.legend}>
            <View
              style={[styles.legendSwatch, { backgroundColor: colors.primary }]}
            />
            <Text
              style={[styles.legendText, { color: colors.mutedForeground }]}
            >
              Green candles show the commission total for each period, rising
              from zero
            </Text>
          </View>
        </>
      ) : (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          No commission history is available for this period.
        </Text>
      )}
    </Panel>
  );
}

function CandlesChart({
  candles,
  interval,
}: {
  candles: CommissionCandle[];
  interval: CandleInterval;
}) {
  const colors = useColors();
  const [viewportWidth, setViewportWidth] = useState(320);
  const chartHeight = 210;
  const chartWidth = viewportWidth;
  const axisWidth = Math.min(44, chartWidth * 0.16);
  const labelHeight = 25;
  const plotWidth = Math.max(0, chartWidth - axisWidth);
  const slotWidth = plotWidth / candles.length;
  const candleWidth = Math.min(
    interval === "monthly" ? 18 : 12,
    slotWidth * 0.62,
  );
  const maximum = Math.max(0, ...candles.map((candle) => candle.close));
  const chartTopValue = maximum > 0 ? maximum * 1.1 : 1;
  const plotTop = 12;
  const plotBottom = chartHeight - labelHeight;
  const plotHeight = plotBottom - plotTop;
  const yFor = (value: number) =>
    plotBottom - (Math.max(0, value) / chartTopValue) * plotHeight;
  const gridValues = [
    chartTopValue,
    chartTopValue * 0.66,
    chartTopValue * 0.33,
    0,
  ];
  const onLayout = (event: LayoutChangeEvent) =>
    setViewportWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.chartViewport} onLayout={onLayout}>
      <Svg width={chartWidth} height={chartHeight}>
        {gridValues.map((value, index) => {
          const y = plotTop + (plotHeight * index) / (gridValues.length - 1);
          return (
            <React.Fragment key={`grid-${index}`}>
              <Line
                x1={axisWidth}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
              />
              <SvgText
                x={axisWidth - 6}
                y={y + 3}
                fill={colors.mutedForeground}
                fontSize={9}
                textAnchor="end"
              >
                {formatAxisValue(value)}
              </SvgText>
            </React.Fragment>
          );
        })}
        {candles.map((candle, index) => {
          const x = axisWidth + slotWidth * index + slotWidth / 2;
          const highY = yFor(candle.high);
          const lowY = yFor(candle.low);
          const openY = yFor(candle.open);
          const closeY = yFor(candle.close);
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(2, Math.abs(closeY - openY));
          const showLabel =
            interval === "monthly" ||
            index % 5 === 0 ||
            index === candles.length - 1;

          return (
            <React.Fragment key={`${candle.period}-${index}`}>
              <Line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={colors.primary}
                strokeWidth={1.5}
              />
              <Rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                rx={2}
                fill={colors.primary}
              />
              {showLabel ? (
                <SvgText
                  x={x}
                  y={chartHeight - 7}
                  fill={colors.mutedForeground}
                  fontSize={9}
                  textAnchor="middle"
                >
                  {candle.label}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

function formatAxisValue(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

const styles = StyleSheet.create({
  panel: { padding: 18, gap: 15 },
  chartViewport: { width: "100%", overflow: "hidden" },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headingCopy: { flex: 1, gap: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: 17 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
  intervalControl: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 11,
  },
  intervalButton: {
    minHeight: 34,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  intervalText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  latest: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 13,
    padding: 12,
  },
  latestCopy: { gap: 3 },
  latestLabel: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 0.8 },
  latestValue: { fontFamily: "Inter_700Bold", fontSize: 19 },
  growth: { alignItems: "flex-end", gap: 3 },
  growthValue: { fontFamily: "Inter_700Bold", fontSize: 17 },
  growthLabel: { fontFamily: "Inter_400Regular", fontSize: 9 },
  legend: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendSwatch: { width: 9, height: 9, borderRadius: 3 },
  legendText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    lineHeight: 14,
  },
});
