import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { DateRange, getMonthDateRange } from '@/lib/deriv';

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
  value: DateRange;
  onChange: (value: DateRange) => void;
}) {
  const colors = useColors();
  const [start, setStart] = useState(value.start);
  const [end, setEnd] = useState(value.end);
  const [calendarTarget, setCalendarTarget] = useState<'start' | 'end' | null>(
    null,
  );
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const selected = new Date(`${value.start}T00:00:00.000Z`);
    return new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1));
  });
  const selectedDate = new Date(`${value.start}T00:00:00.000Z`);
  const selectedYear = selectedDate.getUTCFullYear();
  const selectedMonth = selectedDate.getUTCMonth();
  const months = Array.from({ length: 12 }, (_, month) =>
    new Intl.DateTimeFormat(undefined, { month: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(selectedYear, month, 1)),
    ),
  );
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(selectedYear, selectedMonth, 1)));

  useEffect(() => {
    setStart(value.start);
    setEnd(value.end);
  }, [value.end, value.start]);

  const updateRange = (nextStart: string, nextEnd: string) => {
    setStart(nextStart);
    setEnd(nextEnd);
    if (
      isValidIsoDate(nextStart) &&
      isValidIsoDate(nextEnd) &&
      nextStart <= nextEnd
    ) {
      onChange({ start: nextStart, end: nextEnd });
    }
  };

  const dateError =
    !isValidIsoDate(start) || !isValidIsoDate(end)
      ? 'Choose valid dates from the calendar.'
      : start > end
        ? 'The start date must be on or before the end date.'
        : null;

  return (
    <View style={styles.dateRangePicker}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Selected month: ${monthLabel} ${selectedYear}. Choose month`}
        accessibilityState={{ expanded: monthPickerOpen }}
        onPress={() => setMonthPickerOpen(true)}
        style={[
          styles.monthSelector,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.monthSelectorText, { color: colors.foreground }]}>
          {monthLabel} {selectedYear}
        </Text>
        <Feather
          name={monthPickerOpen ? 'chevron-up' : 'chevron-down'}
          size={17}
          color={colors.mutedForeground}
        />
      </Pressable>
      <View style={styles.dateFields}>
        <DateSelectionButton
          label="FROM"
          date={start}
          error={Boolean(dateError)}
          onPress={() => {
            const selected = new Date(`${start}T00:00:00.000Z`);
            setCalendarMonth(
              new Date(
                Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1),
              ),
            );
            setCalendarTarget('start');
          }}
        />
        <Feather name="arrow-right" size={15} color={colors.mutedForeground} />
        <DateSelectionButton
          label="TO"
          date={end}
          error={Boolean(dateError)}
          onPress={() => {
            const selected = new Date(`${end}T00:00:00.000Z`);
            setCalendarMonth(
              new Date(
                Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1),
              ),
            );
            setCalendarTarget('end');
          }}
        />
      </View>
      {dateError ? (
        <Text style={[styles.dateError, { color: colors.destructive }]}>
          {dateError}
        </Text>
      ) : null}
      <MonthPickerModal
        visible={monthPickerOpen}
        months={months}
        selectedMonth={selectedMonth}
        year={selectedYear}
        onClose={() => setMonthPickerOpen(false)}
        onSelect={(month) => {
          const range = getMonthDateRange(month, selectedYear);
          setStart(range.start);
          setEnd(range.end);
          onChange(range);
          setMonthPickerOpen(false);
        }}
      />
      <CalendarModal
        visible={calendarTarget !== null}
        month={calendarMonth}
        selectedDate={calendarTarget === 'start' ? start : end}
        onClose={() => setCalendarTarget(null)}
        onMonthChange={setCalendarMonth}
        onSelect={(date) => {
          if (calendarTarget === 'start') updateRange(date, end);
          if (calendarTarget === 'end') updateRange(start, date);
          setCalendarTarget(null);
        }}
      />
    </View>
  );
}

function MonthPickerModal({
  visible,
  months,
  selectedMonth,
  year,
  onClose,
  onSelect,
}: {
  visible: boolean;
  months: string[];
  selectedMonth: number;
  year: number;
  onClose: () => void;
  onSelect: (month: number) => void;
}) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.calendarBackdrop}>
        <Pressable
          accessibilityLabel="Close month selector"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.monthPickerPanel,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.calendarTitle, { color: colors.foreground }]}>
            Select a month · {year}
          </Text>
          <View style={styles.monthPickerGrid}>
            {months.map((month, index) => {
              const selected = index === selectedMonth;
              return (
                <View key={month} style={styles.monthPickerCell}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => onSelect(index)}
                    style={[
                      styles.monthPickerOption,
                      selected && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.periodText,
                        {
                          color: selected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ]}
                    >
                      {month}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DateSelectionButton({
  label,
  date,
  error,
  onPress,
}: {
  label: string;
  date: string;
  error: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDate();

  return (
    <View style={styles.dateField}>
      <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label === 'FROM' ? 'Start' : 'End'} date, day ${day}. Choose date`}
        onPress={onPress}
        style={[
          styles.dateButton,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
          },
        ]}
      >
        <Text style={[styles.dateDay, { color: colors.foreground }]}>
          {String(day).padStart(2, '0')}
        </Text>
        <Feather name="calendar" size={17} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

function CalendarModal({
  visible,
  month,
  selectedDate,
  onClose,
  onMonthChange,
  onSelect,
}: {
  visible: boolean;
  month: Date;
  selectedDate: string;
  onClose: () => void;
  onMonthChange: (month: Date) => void;
  onSelect: (date: string) => void;
}) {
  const colors = useColors();
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const leadingDays = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(month);
  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dayCells = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.calendarBackdrop}>
        <Pressable
          accessibilityLabel="Close calendar"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.calendarPanel,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.calendarHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() =>
                onMonthChange(new Date(Date.UTC(year, monthIndex - 1, 1)))
              }
              style={styles.calendarNav}
            >
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.calendarTitle, { color: colors.foreground }]}>
              {monthLabel}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() =>
                onMonthChange(new Date(Date.UTC(year, monthIndex + 1, 1)))
              }
              style={styles.calendarNav}
            >
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.calendarGrid}>
            {weekdayLabels.map((weekday) => (
              <View key={weekday} style={styles.calendarCell}>
                <Text
                  style={[
                    styles.weekdayText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {weekday}
                </Text>
              </View>
            ))}
            {dayCells.map((day, index) => {
              if (day === null) {
                return <View key={`blank-${index}`} style={styles.calendarCell} />;
              }
              const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const selected = date === selectedDate;
              return (
                <View key={date} style={styles.calendarCell}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={date}
                    accessibilityState={{ selected }}
                    onPress={() => onSelect(date)}
                    style={[
                      styles.calendarDay,
                      selected && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        {
                          color: selected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
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
  dateRangePicker: { gap: 10 },
  monthSelector: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthSelectorText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  monthPickerPanel: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  monthPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthPickerCell: {
    width: `${100 / 3}%`,
    padding: 3,
  },
  monthPickerOption: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  periodText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  dateFields: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
  },
  dateField: { flex: 1, gap: 5 },
  dateLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  dateButton: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateDay: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  calendarBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  calendarPanel: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarNav: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  calendarTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  calendarDay: {
    width: '82%',
    height: '82%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 99,
  },
  calendarDayText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  dateError: { fontFamily: 'Inter_500Medium', fontSize: 11 },
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
